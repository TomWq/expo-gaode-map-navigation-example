
import { ExpoGaodeMapModule, MapView, MapViewRef, Marker, NaviView, Polyline, type NaviViewRef } from 'expo-gaode-map-navigation';
import { DrivingStrategy, GaodeWebAPI } from 'expo-gaode-map-web-api';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

// 创建动画组件
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedMarker = Animated.createAnimatedComponent(Marker);

export default function WebAPINavigationTest() {


  
  const [apiKey] = useState('');
  // const [api, setApi] = useState<GaodeWebAPI | null>(null);
    const api = new GaodeWebAPI();
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fullPathData, setFullPathData] = useState<Array<{ latitude: number; longitude: number }>>([]);
  
  // Reanimated shared values
  const animationProgress = useSharedValue(0);
  const totalPointsShared = useSharedValue(0);
  
  const [routeResult, setRouteResult] = useState<any>(null);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [routeType, setRouteType] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving');
  const [showNaviView, setShowNaviView] = useState(false);
  
  const mapRef = useRef<MapViewRef>(null);
  const naviViewRef = useRef<NaviViewRef>(null);

  // 初始化 API
  // useEffect(() => {
  //   const newApi = new GaodeWebAPI();
  //   setApi(newApi);
  //   console.log('[WebAPI] API 初始化成功');
  // }, []);

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      
      if (location) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        // 移动地图到当前位置
        mapRef.current?.moveCamera({
          target: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          zoom: 14,
        }, 1000);
        
        toast.success('位置获取成功');
      }
    } catch (error) {
      console.error('[WebAPI] 获取位置失败:', error);
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
      console.warn('[WebAPI] 解析 polyline 失败:', error);
      return [];
    }
  };

  // 使用 Web API 计算路径
  const calculateRouteWithWebAPI = async () => {
    if (isCalculating) {
      toast.warning('路径计算中，请稍候...');
      return;
    }
    
    try {
      if (!api) {
        toast.error('API 未初始化');
        return;
      }
      
      if (!currentLocation) {
        toast.info('请先获取当前位置');
        return;
      }
      
      setIsCalculating(true);

      // 天安门坐标
      const destination = {
        latitude: 39.908823,
        longitude: 116.4074,
      };

      const origin = `${currentLocation.longitude},${currentLocation.latitude}`;
      const dest = `${destination.longitude},${destination.latitude}`;

      console.log(`[WebAPI] 开始计算${routeType}路径...`);
      console.log('[WebAPI] 起点:', origin);
      console.log('[WebAPI] 终点:', dest);
      
      let result: any;
      let routes: any[] = [];
      
      switch (routeType) {
        case 'driving':
          // 驾车路径 - 请求多条路线
          result = await api.route.driving(origin, dest, {
            strategy: DrivingStrategy.DEFAULT,
            show_fields: 'cost,polyline',
          });
          
          if (result.route?.paths) {
            routes = result.route.paths.map((path: any, index: number) => ({
              id: index,
              distance: parseInt(path.distance),
              duration: parseInt(path.cost?.duration || '0'),
              tolls: path.cost?.tolls || '0',
              trafficLights: path.cost?.traffic_lights || '0',
              polyline: path.steps?.flatMap((step: any) =>
                step.polyline && typeof step.polyline === 'string' ? parsePolyline(step.polyline) : []
              ) || [],
              strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
            }));
          }
          break;
          
        case 'walking':
          // 步行路径 - 请求3条备选路线
          result = await api.route.walking(origin, dest, {
            alternative_route: 3,
            show_fields: 'cost,polyline',
          });
          
          if (result.route?.paths) {
            routes = result.route.paths.map((path: any, index: number) => ({
              id: index,
              distance: parseInt(path.distance),
              duration: parseInt(path.cost?.duration || '0'),
              taxi: path.taxi,
              polyline: path.steps?.flatMap((step: any) =>
                step.polyline && typeof step.polyline === 'string' ? parsePolyline(step.polyline) : []
              ) || [],
              strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
            }));
          }
          break;
          
        case 'bicycling':
          // 骑行路径 - 请求3条备选路线
          result = await api.route.bicycling(origin, dest, {
            alternative_route: 3,
            show_fields: 'cost,polyline',
          });
          
          if (result.route?.paths) {
            routes = result.route.paths.map((path: any, index: number) => ({
              id: index,
              distance: parseInt(path.distance),
              duration: parseInt(path.cost?.duration || path.duration || '0'),
              polyline: path.steps?.flatMap((step: any) =>
                step.polyline && typeof step.polyline === 'string' ? parsePolyline(step.polyline) : []
              ) || [],
              strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
            }));
          }
          break;
          
        case 'transit':
          // 公交路径 - 请求多条换乘方案
          result = await api.route.transit(
            origin,
            dest,
            '010', // 起点城市 citycode (北京)
            '010', // 终点城市 citycode (北京)
            {
              strategy: 0, // 推荐模式
              AlternativeRoute: 5, // 返回5条方案
              show_fields: 'cost,polyline',
            }
          );
          
          console.log('[WebAPI] 公交路径原始数据:', JSON.stringify(result, null, 2));
          
          if (result.route?.transits) {
            routes = result.route.transits.map((transit: any, index: number) => {
              console.log(`[WebAPI] 处理公交方案 ${index + 1}:`, {
                distance: transit.distance,
                segments: transit.segments?.length,
              });
              
              // 收集所有换乘段的坐标点
              const allPoints: any[] = [];
              
              transit.segments?.forEach((segment: any, segIndex: number) => {
                console.log(`[WebAPI] 段 ${segIndex + 1}:`, {
                  hasWalking: !!segment.walking,
                  hasBus: !!segment.bus,
                  hasRailway: !!segment.railway,
                });
                
                // 步行段
                if (segment.walking?.steps && Array.isArray(segment.walking.steps)) {
                  segment.walking.steps.forEach((step: any, stepIndex: number) => {
                    // 公交 API 的 polyline 是个对象 { polyline: "..." }
                    const polylineStr = step.polyline?.polyline || step.polyline;
                    if (polylineStr && typeof polylineStr === 'string') {
                      const parsed = parsePolyline(polylineStr);
                      console.log(`[WebAPI] 步行段 ${stepIndex + 1}: ${parsed.length} 个点`);
                      if (parsed.length > 0) {
                        allPoints.push(...parsed);
                      }
                    }
                  });
                }
                
                // 公交段
                if (segment.bus?.buslines && Array.isArray(segment.bus.buslines)) {
                  segment.bus.buslines.forEach((busline: any, busIndex: number) => {
                    // 公交 API 的 polyline 是个对象 { polyline: "..." }
                    const polylineStr = busline.polyline?.polyline || busline.polyline;
                    if (polylineStr && typeof polylineStr === 'string') {
                      const parsed = parsePolyline(polylineStr);
                      console.log(`[WebAPI] 公交线 ${busIndex + 1} (${busline.name}): ${parsed.length} 个点`);
                      if (parsed.length > 0) {
                        allPoints.push(...parsed);
                      }
                    }
                  });
                }
                
                // 地铁段
                if (segment.railway?.buslines && Array.isArray(segment.railway.buslines)) {
                  segment.railway.buslines.forEach((busline: any, railIndex: number) => {
                    // 公交 API 的 polyline 是个对象 { polyline: "..." }
                    const polylineStr = busline.polyline?.polyline || busline.polyline;
                    if (polylineStr && typeof polylineStr === 'string') {
                      const parsed = parsePolyline(polylineStr);
                      console.log(`[WebAPI] 地铁线 ${railIndex + 1} (${busline.name}): ${parsed.length} 个点`);
                      if (parsed.length > 0) {
                        allPoints.push(...parsed);
                      }
                    }
                  });
                }
              });
              
              console.log(`[WebAPI] 方案 ${index + 1} 总共收集到 ${allPoints.length} 个坐标点`);
              
              return {
              id: index,
              distance: parseInt(transit.distance),
              duration: parseInt(transit.cost?.duration || '0'),
              transitFee: transit.cost?.transit_fee || '0',
              walkingDistance: parseInt(transit.walking_distance || '0'),
              polyline: allPoints,
              strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
              // 保存换乘详情用于显示
              segments: transit.segments,
              };
            });
          }
          
          console.log('[WebAPI] 公交路径解析完成，routes:', routes.length);
          routes.forEach((r, i) => {
            console.log(`[WebAPI] 路线 ${i + 1}: ${r.polyline?.length || 0} 个坐标点`);
          });
          break;
      }

      console.log('[WebAPI] 路径规划成功，共', routes.length, '条路线');
      console.log('[WebAPI] 第一条路线点数:', routes[0]?.polyline?.length);

      if (routes.length === 0) {
        toast.error('未找到路径');
        return;
      }

      setAllRoutes(routes);
      setSelectedRouteIndex(0);
      const firstRoute = routes[0];
      setRouteResult(firstRoute);
      
      // 开始动画显示路径
      if (firstRoute.polyline && firstRoute.polyline.length > 0) {
        animatePolyline(firstRoute.polyline);
      }

      // 格式化距离显示
      const formatDistance = (meters: number) => {
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)}公里`;
        }
        return `${meters}米`;
      };
      
      toast.success(`路径规划成功！\n距离: ${formatDistance(firstRoute.distance)}\n预计用时: ${Math.floor(firstRoute.duration / 60)}分钟`);
    } catch (error) {
      console.error('[WebAPI] 路径规划失败:', error);
      toast.error(`路径规划失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // 简化路径点
  const simplifyPath = (
    points: Array<{ latitude: number; longitude: number }>,
    maxPoints: number = 200
  ): Array<{ latitude: number; longitude: number }> => {
    if (points.length <= maxPoints) return points;
    
    const step = Math.floor(points.length / maxPoints);
    const simplified: Array<{ latitude: number; longitude: number }> = [];
    
    simplified.push(points[0]);
    
    for (let i = step; i < points.length - 1; i += step) {
      simplified.push(points[i]);
    }
    
    simplified.push(points[points.length - 1]);
    
    return simplified;
  };
  
  // 动画显示路径
  const animatePolyline = (fullPath: Array<{ latitude: number; longitude: number }>) => {
    setIsAnimating(true);
    
    const simplifiedPath = simplifyPath(fullPath, 150);
    console.log(`[WebAPI动画] 原始点数: ${fullPath.length}, 简化后: ${simplifiedPath.length}`);
    
    setFullPathData(simplifiedPath);
    
    const totalPoints = simplifiedPath.length;
    totalPointsShared.value = totalPoints;
    
    const duration = Math.max(4000, totalPoints * 20);
    
    const handleAnimationComplete = () => {
      setIsAnimating(false);
      
      // 调整视角显示整条路径
      if (mapRef.current && fullPath.length > 0) {
        setTimeout(() => {
          const lats = fullPath.map(p => p.latitude);
          const lngs = fullPath.map(p => p.longitude);
          const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
          const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
          
          mapRef.current?.moveCamera({
            target: { latitude: centerLat, longitude: centerLng },
            zoom: 13,
          }, 1000);
        }, 100);
      }
    };
    
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleAnimationComplete)();
      }
    });
  };
  
  // 动画路径显示
  const animatedPolylineProps = useAnimatedProps(() => {
    'worklet';
    const totalPoints = totalPointsShared.value;
    if (totalPoints === 0 || fullPathData.length === 0) {
      return { points: [] };
    }
    
    const currentPointCount = Math.ceil(animationProgress.value * totalPoints);
    const visiblePoints = fullPathData.slice(0, Math.max(2, currentPointCount));
    
    return {
      points: visiblePoints,
    };
  }, [fullPathData]);
  
  // 动画 Marker 位置
  const animatedMarkerPosition = useAnimatedProps(() => {
    'worklet';
    const totalPoints = totalPointsShared.value;
    if (totalPoints === 0 || fullPathData.length === 0) {
      return { position: { latitude: 0, longitude: 0 } };
    }
    
    const currentIndex = Math.floor(animationProgress.value * (totalPoints - 1));
    const safeIndex = Math.min(Math.max(0, currentIndex), totalPoints - 1);
    
    return {
      position: fullPathData[safeIndex],
    };
  }, [fullPathData]);
  
  // 定期移动相机跟随动画
  useEffect(() => {
    if (!isAnimating || fullPathData.length === 0) return;
    
    const interval = setInterval(() => {
      const progress = animationProgress.value;
      const currentIndex = Math.floor(progress * fullPathData.length);
      
      if (currentIndex > 0 && currentIndex < fullPathData.length) {
        const currentPos = fullPathData[currentIndex];
        mapRef.current?.moveCamera({
          target: currentPos,
          zoom: 15,
        }, 300);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isAnimating, fullPathData]);

  // 启动导航
  const startNavigation = async () => {
    if (!currentLocation || !routeResult) {
      toast.info('请先规划路径');
      return;
    }

    const destination = {
      latitude: 39.908823,
      longitude: 116.397470,
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
        console.log('[WebAPI] 启动导航失败', String(error));
        toast.error(`启动导航失败: ${String(error)}`);
        setShowNaviView(false);
      }
    }, 500);
  };

  const closeNaviView = () => {
    setShowNaviView(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Web API 路径规划' }} />
      
      {showNaviView ? (
        <View style={styles.navContainer}>
          <NaviView
            ref={naviViewRef}
            style={styles.naviView}
            naviType={1}
            showCamera={true}
            enableVoice={true}
            showMode={1}
            isNightMode
            routeMarkerVisible={{
              showStartEndVia: true,
              showFootFerry: true,
              showForbidden: true,
              showRouteStartIcon: true,
              showRouteEndIcon: true,
            }}
            showDriveCongestion={true}
            showTrafficLightView={true}
            onNaviEnd={(e) => {
              console.log('[WebAPI] 导航结束', e.nativeEvent);
              toast.success('导航结束: ' + e.nativeEvent.reason);
              setShowNaviView(false);
            }}
            onArrive={(e) => {
              console.log('[WebAPI] 到达目的地', e.nativeEvent);
              toast.success('您已到达目的地！');
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
              zoom: 12,
            }}
            myLocationEnabled={true}
            compassEnabled={true}
          >
            {/* 显示当前位置 */}
            {currentLocation && (
              <Marker
                position={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="当前位置"
                pinColor="green"
              />
            )}

            {/* 动画显示路径 */}
            {fullPathData.length > 1 && (
              <AnimatedPolyline
                points={fullPathData}
                animatedProps={animatedPolylineProps}
                strokeWidth={5}
                strokeColor="#2196F3"
              />
            )}
            
            {/* 动画移动的标记 */}
            {isAnimating && fullPathData.length > 0 && (
              <AnimatedMarker
                position={fullPathData[0]}
                animatedProps={animatedMarkerPosition}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={99}
              >
                <Animated.View style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 32 }}>
                    {routeType === 'driving' ? '🚗' :
                     routeType === 'walking' ? '🚶' :
                     routeType === 'bicycling' ? '🚴' : '🚌'}
                  </Text>
                </Animated.View>
              </AnimatedMarker>
            )}
          </MapView>

          {/* 路径类型选择器 */}
          <View style={styles.routeTypeSelector}>
            <Text style={styles.selectorTitle}>路径类型:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'driving' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('driving')}
                >
                  <Text style={styles.routeTypeText}>🚗 驾车</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'walking' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('walking')}
                >
                  <Text style={styles.routeTypeText}>🚶 步行</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'bicycling' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('bicycling')}
                >
                  <Text style={styles.routeTypeText}>🚴 骑行</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'transit' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('transit')}
                >
                  <Text style={styles.routeTypeText}>🚌 公交</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
              <Text style={styles.buttonText}>📍 获取当前位置</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isCalculating && styles.disabledButton
              ]}
              onPress={calculateRouteWithWebAPI}
              disabled={isCalculating}
            >
              <Text style={styles.buttonText}>
                {isCalculating ? '计算中...' : '🗺️ 使用 Web API 规划路径'}
              </Text>
            </TouchableOpacity>

            {routeResult && (
              <TouchableOpacity style={[styles.button, styles.navigationButton]} onPress={startNavigation}>
                <Text style={styles.buttonText}>🧭 启动导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 路线选择器 */}
          {allRoutes.length > 1 && (
            <View style={styles.routeSelector}>
              <Text style={styles.routeSelectorTitle}>选择路线 ({allRoutes.length}条):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.routeButtons}>
                  {allRoutes.map((route: any, index: number) => (
                    <TouchableOpacity
                      key={route.id}
                      style={[
                        styles.routeButton,
                        selectedRouteIndex === index && styles.selectedRouteButton,
                      ]}
                      onPress={() => {
                        setSelectedRouteIndex(index);
                        setRouteResult(route);
                        
                        if (route.polyline && route.polyline.length > 0) {
                          animatePolyline(route.polyline);
                        }
                      }}
                    >
                      <Text style={[
                        styles.routeButtonText,
                        selectedRouteIndex === index && styles.selectedRouteButtonText
                      ]}>
                        {route.strategyName}
                      </Text>
                      <Text style={[
                        styles.routeInfo,
                        selectedRouteIndex === index && styles.selectedRouteInfo
                      ]}>
                        {route.distance >= 1000
                          ? `${(route.distance / 1000).toFixed(2)}公里`
                          : `${route.distance}米`} · {Math.floor(route.duration / 60)}分钟
                      </Text>
                      {route.tolls && route.tolls !== '0' && (
                        <Text style={[
                          styles.routeDetail,
                          selectedRouteIndex === index && styles.selectedRouteDetail
                        ]}>
                          过路费: ¥{route.tolls}
                        </Text>
                      )}
                      {route.transitFee && route.transitFee !== '0' && (
                        <Text style={[
                          styles.routeDetail,
                          selectedRouteIndex === index && styles.selectedRouteDetail
                        ]}>
                          公交费: ¥{route.transitFee}
                        </Text>
                      )}
                      {route.walkingDistance > 0 && (
                        <Text style={[
                          styles.routeDetail,
                          selectedRouteIndex === index && styles.selectedRouteDetail
                        ]}>
                          步行: {route.walkingDistance}米
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 状态信息 */}
          <View style={styles.info}>
            <Text style={styles.infoText}>
              💡 使用高德 Web API 进行路径规划
            </Text>
            <Text style={styles.infoText}>
              {currentLocation
                ? `📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                : '未获取位置'
              }
            </Text>
            {routeResult && (
              <>
                <Text style={styles.infoText}>
                  📏 距离: {routeResult.distance >= 1000
                    ? `${(routeResult.distance / 1000).toFixed(2)}公里`
                    : `${routeResult.distance}米`}
                </Text>
                <Text style={styles.infoText}>
                  ⏱️ 预计: {Math.floor(routeResult.duration / 60)}分钟
                </Text>
                {routeResult.tolls && routeResult.tolls !== '0' && (
                  <Text style={styles.infoText}>
                    💰 过路费: ¥{routeResult.tolls}
                  </Text>
                )}
                {routeResult.transitFee && routeResult.transitFee !== '0' && (
                  <Text style={styles.infoText}>
                    🚌 公交费: ¥{routeResult.transitFee}
                  </Text>
                )}
                {routeResult.walkingDistance > 0 && (
                  <Text style={styles.infoText}>
                    🚶 步行距离: {routeResult.walkingDistance}米
                  </Text>
                )}
              </>
            )}
          </View>
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
  routeTypeSelector: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
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
    marginBottom: 8,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routeTypeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeRouteType: {
    backgroundColor: '#2196F3',
  },
  routeTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  controls: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  navigationButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  routeSelector: {
    position: 'absolute',
    top: 260,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 120,
  },
  routeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  routeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  routeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  selectedRouteButton: {
    backgroundColor: '#4CAF50',
  },
  routeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedRouteButtonText: {
    color: '#fff',
  },
  routeInfo: {
    fontSize: 12,
    color: '#666',
  },
  selectedRouteInfo: {
    color: '#fff',
  },
  routeDetail: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  selectedRouteDetail: {
    color: '#e0e0e0',
  },
  info: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
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
});