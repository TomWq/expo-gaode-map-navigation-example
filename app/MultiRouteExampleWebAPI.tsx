import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import { GaodeWebAPI, DrivingStrategy as WebDrivingStrategy } from 'expo-gaode-map-web-api';
import { MapView, Marker, Polyline, MapViewRef, NaviView, type NaviViewRef, ExpoGaodeMapModule } from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';

// 定义带有策略信息的路线接口
interface ExtendedRouteResult {
  id: number;
  strategyName: string;
  strategyId: number;
  color: string;
  strategy: WebDrivingStrategy;
  distance: number;
  duration: number;
  tolls: string;
  trafficLights: string;
  polyline: Array<{ latitude: number; longitude: number }>;
}

const { width, height } = Dimensions.get('window');

// 路线颜色配置
const ROUTE_COLORS = [
  '#2196F3', // 蓝色 - 速度优先
  '#4CAF50', // 绿色 - 少收费
  '#FF9800', // 橙色 - 不走高速
  '#9C27B0', // 紫色 - 躲避拥堵
];

const ROUTE_NAMES = ['速度优先', '少收费', '不走高速', '躲避拥堵'];

export default function MultiRouteExampleWebAPI() {

  // const [api, setApi] = useState<GaodeWebAPI | null>(null);
    const api = new GaodeWebAPI();
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [allRoutes, setAllRoutes] = useState<ExtendedRouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [showNaviView, setShowNaviView] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeStrategies, setRouteStrategies] = useState<{ id: number; name: string; strategy: WebDrivingStrategy; color: string }[]>([]);
  const [calculatingProgress, setCalculatingProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  
  const mapRef = useRef<MapViewRef>(null);
  const naviViewRef = useRef<NaviViewRef>(null);
  const isCalculatingRef = useRef(false);

  // // 初始化 Web API
  // useEffect(() => {
  //   const newApi = new GaodeWebAPI();
  //   setApi(newApi);
  //   console.log('[MultiRouteWebAPI] API 初始化成功');
  // }, []);

  // 获取当前位置
  const getCurrentLocation = async (moveMap: boolean = false) => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      
      if (location) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        // 只有在用户手动点击刷新时才移动地图
        if (moveMap && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.moveCamera({
              target: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              zoom: 12,
            }, 1000);
          }, 300);
        }
        
        toast.success('位置获取成功');
      }
    } catch (error) {
      console.error('[MultiRouteWebAPI] 获取位置失败:', error);
      toast.error('获取位置失败，请检查定位权限');
    }
  };

  // 解析高德 polyline 字符串为坐标数组
  const parsePolyline = (polylineStr: string | undefined): Array<{ latitude: number; longitude: number }> => {
    if (!polylineStr || typeof polylineStr !== 'string') return [];
    
    try {
      const points = polylineStr.split(';');
      return points.map(point => {
        const [lng, lat] = point.split(',').map(Number);
        return { latitude: lat, longitude: lng };
      }).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
    } catch (error) {
      console.warn('[MultiRouteWebAPI] 解析 polyline 失败:', error);
      return [];
    }
  };

  // 使用 Web API 计算多条驾车路线
  const calculateMultipleRoutesWithWebAPI = async () => {
    if (!currentLocation) {
      toast.warning('请先获取当前位置');
      return;
    }
    
    if (!api) {
      toast.error('API 未初始化');
      return;
    }
    
    if (isCalculatingRef.current) {
      toast.warning('路径计算中，请稍候...');
      return;
    }

    setIsCalculating(true);
    isCalculatingRef.current = true;
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setRouteStrategies([]);
    setCalculatingProgress(null);

    // 目的地：首都机场
    const destination = {
      latitude: 40.0799,
      longitude: 116.6031,
    };

    try {
      console.log('[MultiRouteWebAPI] 开始计算多条驾车路线...');
      
      const origin = `${currentLocation.longitude},${currentLocation.latitude}`;
      const dest = `${destination.longitude},${destination.latitude}`;
      
      // 定义不同的策略
      const strategies = [
        { id: 0, name: '速度优先', strategy: WebDrivingStrategy.DEFAULT, color: ROUTE_COLORS[0] },
        { id: 1, name: '少收费', strategy: WebDrivingStrategy.LESS_TOLL, color: ROUTE_COLORS[1] },
        { id: 2, name: '不走高速', strategy: WebDrivingStrategy.NO_HIGHWAY, color: ROUTE_COLORS[2] },
        { id: 3, name: '躲避拥堵', strategy: WebDrivingStrategy.AVOID_JAM, color: ROUTE_COLORS[3] }
      ];
      
      setRouteStrategies(strategies);
      
      // 并行计算多条路线（Web API 可以并行请求）
      const routePromises = strategies.map(async (s, i) => {
        console.log(`[MultiRouteWebAPI] 开始计算第 ${i + 1} 条路线: ${s.name}`);
        
        // 更新计算进度
        setCalculatingProgress({
          current: i + 1,
          total: strategies.length,
          currentName: s.name,
        });
        
        try {
          const result = await api.route.driving(origin, dest, {
            strategy: s.strategy,
            show_fields: 'cost,polyline',
          });
          
          console.log(`[MultiRouteWebAPI] ${s.name} 计算结果:`, result);
          
          if (result.route?.paths && result.route.paths.length > 0) {
            const path = result.route.paths[0];
            
            // 收集所有步骤的坐标点
            const allPoints: Array<{ latitude: number; longitude: number }> = [];
            if (path.steps && Array.isArray(path.steps)) {
              path.steps.forEach((step: any) => {
                if (step.polyline && typeof step.polyline === 'string') {
                  const parsed = parsePolyline(step.polyline);
                  if (parsed.length > 0) {
                    allPoints.push(...parsed);
                  }
                }
              });
            }
            
            console.log(`[MultiRouteWebAPI] ${s.name} 成功，坐标点数: ${allPoints.length}`);
            
            return {
              id: s.id,
              strategyName: s.name,
              strategyId: s.id,
              color: s.color,
              strategy: s.strategy,
              distance: parseInt(path.distance),
              duration: parseInt(path.cost?.duration || '0'),
              tolls: path.cost?.tolls || '0',
              trafficLights: path.cost?.traffic_lights || '0',
              polyline: allPoints,
            };
          } else {
            console.warn(`[MultiRouteWebAPI] ${s.name} 没有返回有效路线`);
            return null;
          }
        } catch (error) {
          console.error(`[MultiRouteWebAPI] ${s.name}路线计算失败:`, error);
          return null;
        }
      });
      
      const results = (await Promise.all(routePromises)).filter((r): r is ExtendedRouteResult => r !== null);
      
      if (results.length > 0) {
        setAllRoutes(results);
        console.log(`[MultiRouteWebAPI] 成功计算${results.length}条路线`);
        
        toast.success(`成功计算${results.length}条路线！请选择合适的路线进行导航`);
        
        // 自动调整视角显示第一条路线
        if (results[0].polyline.length > 0) {
          setTimeout(() => {
            const points = results[0].polyline;
            const lats = points.map(p => p.latitude);
            const lngs = points.map(p => p.longitude);
            const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
            const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
            
            mapRef.current?.moveCamera({
              target: { latitude: centerLat, longitude: centerLng },
              zoom: 11,
            }, 1000);
          }, 500);
        }
      } else {
        toast.error('未能计算出任何路线，请重试');
      }
    } catch (error) {
      console.error('[MultiRouteWebAPI] 计算路线失败:', error);
      toast.error(`计算路线失败: ${String(error)}`);
    } finally {
      setIsCalculating(false);
      isCalculatingRef.current = false;
      setCalculatingProgress(null);
    }
  };

  // 选择路线
  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    
    // 调整视角显示选中的路线
    const route = allRoutes[index];
    if (route.polyline.length > 0) {
      setTimeout(() => {
        const points = route.polyline;
        const lats = points.map(p => p.latitude);
        const lngs = points.map(p => p.longitude);
        const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
        const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
        
        mapRef.current?.moveCamera({
          target: { latitude: centerLat, longitude: centerLng },
          zoom: 11,
        }, 800);
      }, 100);
    }
  };

  // 启动导航
  const startNavigation = async () => {
    if (!currentLocation || allRoutes.length === 0) {
      toast.warning('请先规划路径');
      return;
    }

    const destination = {
      latitude: 40.0799,
      longitude: 116.6031,
    };

    setShowNaviView(true);
    
    setTimeout(async () => {
      try {
        await naviViewRef.current?.startNavigation(
          currentLocation,
          destination,
          1
        );
      } catch (error) {
        console.error('[MultiRouteWebAPI] 启动导航失败:', error);
        toast.error(`启动导航失败: ${String(error)}`);
        setShowNaviView(false);
      }
    }, 500);
  };

  // 关闭导航视图
  const closeNaviView = () => {
    setShowNaviView(false);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '多路线导航 (Web API)' }} />
      {showNaviView ? (
        <View style={styles.navContainer}>
          <NaviView
            ref={naviViewRef}
            style={styles.naviView}
            naviType={1}
            showCamera={true}
            enableVoice={true}
            onNaviStart={(e) => console.log('[MultiRouteWebAPI] 导航开始', e.nativeEvent)}
            onNaviEnd={(e) => {
              console.log('[MultiRouteWebAPI] 导航结束', e.nativeEvent);
              toast.info(`导航结束: ${e.nativeEvent.reason}`);
              setShowNaviView(false);
            }}
            onArrive={(e) => {
              console.log('[MultiRouteWebAPI] 到达目的地', e.nativeEvent);
              toast.success('恭喜，您已到达目的地！');
              setShowNaviView(false);
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={closeNaviView}>
            <Text style={styles.closeButtonText}>关闭导航</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialCameraPosition={{
              target: {
                latitude: 39.9042,
                longitude: 116.4074,
              },
              zoom: 10,
            }}
            myLocationEnabled={true}
            compassEnabled={true}
          >
            {/* 显示当前位置 */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                title="起点"
                pinColor="green"
              />
            )}

            {/* 只显示选中的路线 */}
            {allRoutes.map((route, index) => {
              const isSelected = selectedRouteIndex === index;
              
              // 只渲染选中的路线
              if (!isSelected) return null;
              
              console.log(`[MultiRouteWebAPI] 显示路线 ${index} (${route.strategyName}), 颜色: ${route.color}, 点数: ${route.polyline.length}`);
              
              return (
                <Polyline
                  key={`route-${route.id}`}
                  points={route.polyline}
                  strokeWidth={8}
                  strokeColor={route.color}
                  zIndex={10}
                />
              );
            })}

            {/* 显示目的地 */}
            <Marker
              position={{
                latitude: 40.0799,
                longitude: 116.6031,
              }}
              title="终点：首都机场"
              pinColor="red"
            />
          </MapView>

          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={() => getCurrentLocation(true)}
            >
              <Text style={styles.buttonText}>📍 刷新位置</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.calculateButton, isCalculating && styles.disabledButton]} 
              onPress={calculateMultipleRoutesWithWebAPI}
              disabled={isCalculating}
            >
              <Text style={styles.buttonText}>
                {isCalculating ? '计算中...' : '🗺️ 计算多条路线 (Web API)'}
              </Text>
            </TouchableOpacity>

            {allRoutes.length > 0 && (
              <TouchableOpacity 
                style={[styles.button, styles.navigationButton]} 
                onPress={startNavigation}
              >
                <Text style={styles.buttonText}>🧭 开始导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 计算进度指示器 */}
          {isCalculating && calculatingProgress && (
            <View style={styles.progressOverlay}>
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>正在计算路线...</Text>
                <Text style={styles.progressText}>
                  {calculatingProgress.current} / {calculatingProgress.total}
                </Text>
                <Text style={styles.progressRoute}>
                  当前: {calculatingProgress.currentName}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(calculatingProgress.current / calculatingProgress.total) * 100}%`,
                        backgroundColor: ROUTE_COLORS[calculatingProgress.current - 1] || '#2196F3'
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 路线选择器 */}
          {allRoutes.length > 0 && (
            <View style={styles.routeSelector}>
              <Text style={styles.selectorTitle}>选择路线（点击查看详情）:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.routeCards}>
                  {allRoutes.map((route, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.routeCard,
                        selectedRouteIndex === index && styles.selectedRouteCard,
                        { borderColor: route.color }
                      ]}
                      onPress={() => selectRoute(index)}
                    >
                      <View style={styles.routeHeader}>
                        <Text style={[
                          styles.routeTitle,
                          { color: route.color }
                        ]}>
                          {route.strategyName}
                        </Text>
                        {selectedRouteIndex === index && (
                          <Text style={styles.selectedBadge}>当前选择</Text>
                        )}
                      </View>
                      
                      <Text style={styles.routeDistance}>
                        {route.distance >= 1000
                          ? `${(route.distance / 1000).toFixed(2)}公里`
                          : `${route.distance}米`}
                      </Text>
                      
                      <Text style={styles.routeDuration}>
                        {Math.floor(route.duration / 60)}分钟
                      </Text>
                      
                      {route.tolls !== '0' && (
                        <Text style={styles.routeToll}>
                          过路费: ¥{route.tolls}
                        </Text>
                      )}
                      
                      {route.trafficLights !== '0' && (
                        <Text style={styles.routeToll}>
                          红绿灯: {route.trafficLights}个
                        </Text>
                      )}
                      
                      <View style={[
                        styles.routeIndicator,
                        { backgroundColor: route.color }
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 路线对比信息 */}
          {allRoutes.length > 1 && (
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonTitle}>路线对比</Text>
              <View style={styles.comparisonGrid}>
                {allRoutes.map((route, index) => (
                  <View key={index} style={styles.comparisonItem}>
                    <Text style={[
                      styles.comparisonLabel,
                      { color: route.color }
                    ]}>
                      {route.strategyName}
                    </Text>
                    <Text style={styles.comparisonValue}>
                      {Math.floor(route.duration / 60)}分
                    </Text>
                    <Text style={styles.comparisonDetail}>
                      {route.distance >= 1000
                        ? `${(route.distance / 1000).toFixed(1)}km`
                        : `${route.distance}m`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#607D8B',
  },
  calculateButton: {
    backgroundColor: '#2196F3',
  },
  navigationButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  routeSelector: {
    position: 'absolute',
    top: 190,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  routeCards: {
    flexDirection: 'row',
    gap: 10,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
    position: 'relative',
  },
  selectedRouteCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedBadge: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  routeDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeToll: {
    fontSize: 12,
    color: '#999',
  },
  routeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  comparisonInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  comparisonDetail: {
    fontSize: 12,
    color: '#ccc',
  },
  navContainer: {
    flex: 1,
    position: 'relative',
  },
  naviView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 8,
  },
  progressRoute: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});