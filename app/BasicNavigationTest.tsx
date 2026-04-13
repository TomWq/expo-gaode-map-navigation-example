import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import type { Coordinates, DriveRouteOptions, RideRouteOptions, RouteResult, TruckRouteOptions, WalkRouteOptions } from 'expo-gaode-map-navigation';
import { ExpoGaodeMapModule, MapView, MapViewRef, Marker, NaviView, Polyline, RouteType, type NaviViewRef } from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';



// 创建动画组件
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedMarker = Animated.createAnimatedComponent(Marker);

export default function BasicNavigationTest() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [naviPath, setNaviPath] = useState<{
    points: Array<{ latitude: number; longitude: number }>;
  } | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const isCalculatingRef = useRef(false);
  const [fullPathData, setFullPathData] = useState<Array<{ latitude: number; longitude: number }>>([]);
  
  // Reanimated shared values
  const animationProgress = useSharedValue(0);
  const totalPointsShared = useSharedValue(0);
  
  const [routeResult, setRouteResult] = useState<any>(null);
  const [allRoutes, setAllRoutes] = useState<any>(null); // 保存所有路线
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [routeType, setRouteType] = useState<string>('drive');
  const [animatingRouteType, setAnimatingRouteType] = useState<string>('drive'); // 记录动画时的路径类型
  const [showNaviView, setShowNaviView] = useState(false);
  const mapRef = useRef<MapViewRef>(null);
  const naviViewRef = useRef<NaviViewRef>(null);

  useEffect(()=>{
      ExpoGaodeMapModule.setInterval(5000);
        ExpoGaodeMapModule.setDistanceFilter(10);
        ExpoGaodeMapModule.setDesiredAccuracy(3);

  },[])

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
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      toast.error('错误,获取位置失败，请检查定位权限');
    }
  };

  // 基础路径规划
  const calculateRoute = async () => {
    // 防止重复计算
    if (isCalculating || isCalculatingRef.current) {
      toast.warning('路径计算中，请稍候...');
      return;
    }
    
    try {
      if (!currentLocation) {
        toast.info('提示,请先获取当前位置');
        return;
      }
      
      setIsCalculating(true);
      isCalculatingRef.current = true;

      // 天安门坐标
      const destination = {
        latitude: 39.908823,
        longitude: 116.4074,
      };

      console.log(`[BasicNavigation] 开始计算${routeType}路径...`);
      
      let result;
      
      switch (routeType) {
        case 'drive':
          console.log('[BasicNavigation] 开始计算驾车路线...');
          const driveOptions: DriveRouteOptions = {
            from: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            to: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            type: RouteType.DRIVE,
          };
          console.log('[BasicNavigation] 调用参数:', JSON.stringify(driveOptions, null, 2));
          try {
            result = await ExpoGaodeMapNavigation.calculateDriveRoute(driveOptions);
            console.log('[BasicNavigation] 驾车路线计算完成');
          } catch (error) {
            console.error('[BasicNavigation] 驾车路线计算错误:', error);
            throw error;
          }
          break;
          
        case 'walk':
          const walkOptions: WalkRouteOptions = {
            from: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            to: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            type: RouteType.WALK,
            multiple: true,
          };
          result = await ExpoGaodeMapNavigation.calculateWalkRoute(walkOptions);
          break;
          
        case 'ride':
          const rideOptions: RideRouteOptions = {
            from: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            to: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            type: RouteType.RIDE,
            multiple: true,
          };
          result = await ExpoGaodeMapNavigation.calculateRideRoute(rideOptions);
          break;
          
        case 'truck':
          const truckOptions: TruckRouteOptions = {
            from: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            to: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            type: RouteType.TRUCK,
            size: 2,
            height: 3.5,
            width: 2.5,
            load: 5,
          };
          result = await ExpoGaodeMapNavigation.calculateTruckRoute(truckOptions);
          break;
          
        default:
          toast.error('错误,不支持的路径类型');
          return;
      }

      // console.log('[BasicNavigation] 路径规划结果:', JSON.stringify(result, null, 2));

      // 处理返回结果
      let route: RouteResult;
      if (result && 'routes' in result && Array.isArray(result.routes) && result.routes.length > 0) {
        const routes = result.routes;
        setAllRoutes(routes);
        
        const routeIndex = selectedRouteIndex < routes.length ? selectedRouteIndex : 0;
        setSelectedRouteIndex(routeIndex);
        route = routes[routeIndex];
        
        console.log('[BasicNavigation] 处理路线结果:', routes.length, '条路线');
      } else if (result && 'distance' in result && 'duration' in result) {
        route = result as RouteResult;
        setAllRoutes([route]);
        setSelectedRouteIndex(0);
        console.log('[BasicNavigation] 处理单条路线结果(旧格式)');
      } else {
        console.error('[BasicNavigation] 未找到有效路径:', result);
        toast.error('失败,未找到路径');
        return;
      }
      
      setRouteResult(route);
      console.log('[BasicNavigation] 设置路线结果成功');
      
      // 使用 API 返回的实际路径点
      if (route.polyline && route.polyline.length > 0) {
        animatePolyline(route.polyline, routeType);
      } else if (route.segments && route.segments.length > 0) {
        const allPoints: Coordinates[] = [];
        route.segments.forEach(segment => {
          if (segment.polyline && segment.polyline.length > 0) {
            allPoints.push(...segment.polyline as Coordinates[]);
          }
        });
        
        if (allPoints.length > 0) {
          animatePolyline(allPoints, routeType);
        } else {
          const simulatedPath = [
            currentLocation,
            {
              latitude: (currentLocation.latitude + destination.latitude) / 2,
              longitude: (currentLocation.longitude + destination.longitude) / 2,
            },
            destination,
          ];
          animatePolyline(simulatedPath, routeType);
        }
      } else {
        const simulatedPath = [
          currentLocation,
          {
            latitude: (currentLocation.latitude + destination.latitude) / 2,
            longitude: (currentLocation.longitude + destination.longitude) / 2,
          },
          destination,
        ];
        animatePolyline(simulatedPath, routeType);
      }

      // 格式化距离显示
      const formatDistance = (meters: number) => {
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)}公里`;
        }
        return `${meters}米`;
      };
      
      toast.success(`路径规划成功！\n距离: ${formatDistance(route.distance)}\n预计用时: ${Math.floor(route.duration / 60)}分钟`);
    } catch (error) {
      console.error('[BasicNavigation] 路径规划失败:', error);
      toast.error(`路径规划失败: ${String(error)}`);
    } finally {
      setIsCalculating(false);
      isCalculatingRef.current = false;
    }
  };

  // 简单的等间隔抽样，减少点数
  const simplifyPath = (
    points: Array<{ latitude: number; longitude: number }>,
    maxPoints: number = 200 // 最多保留100个点
  ): Array<{ latitude: number; longitude: number }> => {
    if (points.length <= maxPoints) return points;
    
    const step = Math.floor(points.length / maxPoints);
    const simplified: Array<{ latitude: number; longitude: number }> = [];
    
    // 保留第一个点
    simplified.push(points[0]);
    
    // 等间隔抽样
    for (let i = step; i < points.length - 1; i += step) {
      simplified.push(points[i]);
    }
    
    // 保留最后一个点
    simplified.push(points[points.length - 1]);
    
    return simplified;
  };
  
  // 使用纯 Reanimated 动画 - 在UI线程运行，更流畅
  const animatePolyline = (fullPath: Array<{ latitude: number; longitude: number }>, type?: string) => {
    setIsAnimating(true);
    setAnimatingRouteType(type || routeType);
    setNaviPath({ points: fullPath });
    
    // 简化路径点，减少渲染压力
    const simplifiedPath = simplifyPath(fullPath, 80);
    console.log(`[动画] 原始点数: ${fullPath.length}, 简化后: ${simplifiedPath.length}`);
    
    setFullPathData(simplifiedPath);
    
    const totalPoints = simplifiedPath.length;
    totalPointsShared.value = totalPoints;
    
    const duration = Math.max(5000, totalPoints * 25); // 更平滑的时间
    
    // 动画完成回调
    const handleAnimationComplete = () => {
      setIsAnimating(false);
      
      // 动画完成后调整视角
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
    
    // 重置并启动动画 - 完全在UI线程运行
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear, // 使用线性动画，避免后半段加速导致抖动
    }, (finished) => {
      if (finished) {
        runOnJS(handleAnimationComplete)();
      }
    });
  };
  
  // 使用 useAnimatedProps 在 UI 线程动态计算显示的路径点
  const animatedPolylineProps = useAnimatedProps(() => {
    'worklet';
    const totalPoints = totalPointsShared.value;
    if (totalPoints === 0 || fullPathData.length === 0) {
      return { points: [] };
    }
    
    // 使用 Math.ceil 确保渐进显示
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
  
  // 使用 useEffect 监听动画进度，定期移动相机（更安全）
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
    }, 500); // 每500ms移动一次相机
    
    return () => clearInterval(interval);
  }, [isAnimating, fullPathData]);
  
  // Marker的脉冲缩放效果
  const markerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        scale: withTiming(isAnimating ? 1.2 : 1, {
          duration: 500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      }],
    };
  });

  // 启动导航
  const startNavigation = async () => {
    if (!currentLocation || !routeResult) {
      toast.info('请先规划路径');
      return;
    }

    // 天安门坐标
    const destination = {
      latitude: 39.908823,
      longitude: 116.397470,
    };

    // 显示导航视图
    setShowNaviView(true);
    
    // 等待视图渲染后启动导航
    setTimeout(async () => {
      try {
        await naviViewRef.current?.startNavigation(
          currentLocation,
          destination,
          1
        );
      } catch (error) {
        console.log('启动导航失败', String(error));
        toast.error(`启动导航失败,${String(error)}`, );
        setShowNaviView(false);
      }
    }, 500);
  };

  // 关闭导航视图
  const closeNaviView = () => {
    setShowNaviView(false);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      console.log('[BasicNavigation] 组件卸载，清理路径计算状态');
      setIsCalculating(false);
      isCalculatingRef.current = false;
      setIsAnimating(false);
      
      // 清理原生层的计算实例
      try {
        ExpoGaodeMapNavigation.destroyAllCalculators();
      } catch (error) {
        console.warn('[BasicNavigation] 清理原生计算器失败:', error);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title:'基础导航',
        headerShown: false,
      }}/>
    
      {showNaviView ? (
        <View style={styles.navContainer}>
          <NaviView
            ref={naviViewRef}
            style={styles.naviView}
            naviType={1}
            showCamera={true}
            enableVoice={true}
            showMode={1}
            isNaviTravelView={true}
             // 路线标记点配置（新增2个参数）
          routeMarkerVisible={{
            showStartEndVia: true,      // 起终途点
            showFootFerry: true,         // 步行轮渡
            showForbidden: true,         // 禁行限行
            showRouteStartIcon: true,    // 路线起点icon
            showRouteEndIcon: true,      // 路线终点icon
          }}
          
          // 新增功能
          showDriveCongestion={true}     // 拥堵气泡 
          showTrafficLightView={true}    // 红绿灯倒计时 
            onNaviStart={(e) => {
              console.log('导航开始', e.nativeEvent);
            }}
            onNaviEnd={(e) => {
              console.log('导航结束', e.nativeEvent);
              toast.success('导航结束' +  e.nativeEvent.reason);
              setShowNaviView(false);
            }}
            onArrive={(e) => {
              console.log('到达目的地', e.nativeEvent);
              toast.success('您已到达目的地！');
              setShowNaviView(false);
            }}
            onCalculateRouteSuccess={(e) => {
              console.log('路径规划成功', e.nativeEvent);
            }}
            onCalculateRouteFailure={(e) => {
              console.log('路径规划失败', e.nativeEvent);
              toast.error('路径规划失败' + e.nativeEvent.error || '未知错误');
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

            {/* 使用 AnimatedPolyline - 完全在UI线程运行 */}
            {fullPathData.length > 1 && (
              <AnimatedPolyline
                points={fullPathData}
                animatedProps={animatedPolylineProps}
                strokeWidth={5}
                strokeColor="#2196F3"
              />
            )}
            
            {/* 动画过程中显示移动的图标 */}
            {isAnimating && fullPathData.length > 0 && (
              <AnimatedMarker
                position={fullPathData[0]}
                animatedProps={animatedMarkerPosition}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={99}
              >
                <Animated.View style={[{ 
                  width: 40, 
                  height: 40, 
                  alignItems: 'center', 
                  backgroundColor: '#000',
                  justifyContent: 'center' 
                  }]}>
                  {/* <Text style={{ fontSize: 32 }}>
                    {animatingRouteType === 'drive' || animatingRouteType === 'truck' ? '🚗' :
                     animatingRouteType === 'walk' ? '🚶' :
                     animatingRouteType === 'ride' ? '🚴' : '🚗'}
                   
                  </Text> */}
                </Animated.View>
              </AnimatedMarker>
            )}
          </MapView>
            <View style={styles.controlsContainer}>
          {/* 路径类型选择器 */}
          <View style={styles.routeTypeSelector}>
            <Text style={styles.selectorTitle}>选择路径类型:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[
                    styles.routeTypeButton, 
                    routeType === 'drive' && styles.activeRouteType
                  ]} 
                  onPress={() => setRouteType('drive')}
                >
                  <Text style={styles.routeTypeText}>🚗 驾车</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'walk' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('walk')}
                >
                  <Text style={styles.routeTypeText}>🚶 步行</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'ride' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('ride')}
                >
                  <Text style={styles.routeTypeText}>🚴 骑行</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.routeTypeButton,
                    routeType === 'truck' && styles.activeRouteType
                  ]}
                  onPress={() => setRouteType('truck')}
                >
                  <Text style={styles.routeTypeText}>🚚 货车</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
              <Text style={styles.buttonText}>获取当前位置</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isCalculating && styles.disabledButton
              ]}
              onPress={calculateRoute}
              disabled={isCalculating}
            >
              <Text style={styles.buttonText}>
                {isCalculating
                  ? '计算中...'
                  : `计算${routeType === 'drive' ? '驾车' : routeType === 'walk' ? '步行' : routeType === 'ride' ? '骑行' : '货车'}路径`
                }
              </Text>
            </TouchableOpacity>

            {routeResult && (
              <TouchableOpacity style={[styles.button, styles.navigationButton]} onPress={startNavigation}>
                <Text style={styles.buttonText}>🧭 启动导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 路线选择器（当有多条路线时显示） */}
          {allRoutes && allRoutes.length > 1 && (
            <View style={styles.routeSelector}>
              <Text style={styles.routeSelectorTitle}>选择路线 ({allRoutes.length}条):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.routeButtons}>
                  {allRoutes.map((route: RouteResult, index: number) => (
                    <TouchableOpacity
                      key={route.id || index}
                      style={[
                        styles.routeButton,
                        selectedRouteIndex === index && styles.selectedRouteButton,
                      ]}
                      onPress={() => {
                        setSelectedRouteIndex(index);
                        setRouteResult(route);
                        
                        // 更新显示的路径并启动动画
                        if (route.polyline && route.polyline.length > 0) {
                          animatePolyline(route.polyline, routeType);
                        } else if (route.segments && route.segments.length > 0) {
                          const allPoints: Coordinates[] = [];
                          route.segments.forEach(segment => {
                            if (segment.polyline && segment.polyline.length > 0) {
                              allPoints.push(...segment.polyline as Coordinates[]);
                            }
                          });
                          
                          if (allPoints.length > 0) {
                            animatePolyline(allPoints, routeType);
                          }
                        }
                      }}
                    >
                      <Text style={[
                        styles.routeButtonText,
                        selectedRouteIndex === index && styles.selectedRouteButtonText
                      ]}>
                        路线{index + 1}
                      </Text>
                      <Text style={[
                        styles.routeInfo,
                        selectedRouteIndex === index && styles.selectedRouteInfo
                      ]}>
                        {route.distance >= 1000
                          ? `${(route.distance / 1000).toFixed(2)}公里`
                          : `${route.distance}米`} · {Math.floor(route.duration / 60)}分钟
                      </Text>
                      <Text style={[
                        styles.routeDetail,
                        selectedRouteIndex === index && styles.selectedRouteDetail
                      ]}>
                        {(route as any).strategyName ||
                         (route.strategy === 0 ? '最快' :
                          route.strategy === 1 ? '少收费' :
                          route.strategy === 2 ? '最短' :
                          route.strategy === 3 ? '少高速' : '推荐')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          </View>
          {/* 状态信息 */}
          <View style={styles.info}>
            <Text style={styles.infoText}>
              {currentLocation
                ? `当前位置: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                : '未获取位置'
              }
            </Text>
            <Text style={styles.infoText}>
              {naviPath ? `路径点数: ${naviPath.points.length}` : '未规划路径'}
            </Text>
            {routeResult && (
              <>
                <Text style={styles.infoText}>
                  距离: {routeResult.distance
                    ? (routeResult.distance >= 1000
                      ? `${(routeResult.distance / 1000).toFixed(2)}公里`
                      : `${routeResult.distance}米`)
                    : '未知'}
                </Text>
                <Text style={styles.infoText}>
                  预计用时: {routeResult.duration ? Math.floor(routeResult.duration / 60) : '未知'}分钟
                </Text>
                {allRoutes && allRoutes.length > 1 && (
                  <Text style={styles.infoText}>
                    当前选择: 路线{selectedRouteIndex + 1}
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
  controlsContainer:{
       position: 'absolute',
       top: 50,
       left: 0,
       right: 0,
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
    alignItems: 'center',
  },
  activeRouteType: {
    backgroundColor: '#2196F3',
  },
  routeTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
    alignItems: 'center',
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
  controls: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'column',
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
    paddingTop:0
  },
  naviView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 160,
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
