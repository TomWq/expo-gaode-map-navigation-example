import {
  DriveStrategy,
  MapView,
  Marker,
  NaviView,
  Polygon,
  Polyline,
  clearIndependentRoute,
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  type IndependentRouteResult,
  type NaviViewRef,
} from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type LatLng = { latitude: number; longitude: number };

const DEFAULT_FROM: LatLng = { latitude: 39.916527, longitude: 116.397128 };
const DEFAULT_TO: LatLng = { latitude: 39.908731, longitude: 116.42695 };

const DEFAULT_POLYGON_TEXT =
  '39.914100,116.405900\n39.913400,116.413000\n39.907600,116.412200\n39.908300,116.404800';

function parsePolygonText(text: string): LatLng[] {
  const points = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [latText, lngText] = line.split(',').map((item) => item.trim());
      const latitude = Number(latText);
      const longitude = Number(lngText);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error(`坐标格式错误: ${line}`);
      }
      return { latitude, longitude };
    });

  if (points.length < 3) {
    throw new Error('避让区域至少需要 3 个点');
  }
  return points;
}

function formatDistance(distance: number): string {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} 公里`;
  }
  return `${Math.round(distance)} 米`;
}

function formatDuration(duration: number): string {
  const mins = Math.max(1, Math.round(duration / 60));
  return `${mins} 分钟`;
}

export default function AvoidanceNaviExample() {
  const naviRef = useRef<NaviViewRef>(null);
  const independentTokenRef = useRef<number | null>(null);

  const [avoidRoad, setAvoidRoad] = useState('长安街');
  const [polygonText, setPolygonText] = useState(DEFAULT_POLYGON_TEXT);
  const [avoidPolygon, setAvoidPolygon] = useState<LatLng[]>(() =>
    parsePolygonText(DEFAULT_POLYGON_TEXT)
  );

  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [routeSummary, setRouteSummary] = useState('');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNaviView, setShowNaviView] = useState(false);

  const previewPoints = useMemo(() => avoidPolygon, [avoidPolygon]);

  const clearCurrentIndependentRoute = async () => {
    const token = independentTokenRef.current;
    if (!token) return;

    independentTokenRef.current = null;
    try {
      await clearIndependentRoute({ token });
    } catch {
      // noop
    }
  };

  useEffect(() => {
    return () => {
      void clearCurrentIndependentRoute();
    };
  }, []);

  const handlePlanRoute = async () => {
    try {
      const parsedPolygon = parsePolygonText(polygonText);
      setAvoidPolygon(parsedPolygon);
      setLoading(true);

      await clearCurrentIndependentRoute();

      const result = (await independentDriveRoute({
        from: DEFAULT_FROM,
        to: DEFAULT_TO,
        strategy: DriveStrategy.AVOID_CONGESTION,
        avoidRoad: avoidRoad.trim() || undefined,
        avoidPolygons: [parsedPolygon],
      })) as IndependentRouteResult;

      if (!result?.token) {
        throw new Error('独立算路未返回有效 token');
      }

      const firstRoute = result.routes?.[0];
      if (!firstRoute?.polyline || firstRoute.polyline.length < 2) {
        throw new Error('未获取到有效独立路线');
      }

      if (result.routeIds?.length) {
        await selectIndependentRoute({
          token: result.token,
          routeId: result.routeIds[0],
        });
      }

      independentTokenRef.current = result.token;
      setSelectedRouteIndex(0);
      setRoutePoints(firstRoute.polyline);
      setRouteSummary(
        `独立路线已规划：${formatDistance(firstRoute.distance)}，约 ${formatDuration(firstRoute.duration)}，共 ${result.count} 条备选`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('规划失败', message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulatedNavi = async () => {
    const token = independentTokenRef.current;
    if (!token) {
      Alert.alert('提示', '请先规划独立避让路线');
      return;
    }

    setShowNaviView(true);
    setTimeout(async () => {
      try {
        await startNaviWithIndependentPath({
          token,
          naviType: 1,
          routeIndex: selectedRouteIndex,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert('启动导航失败', message);
        setShowNaviView(false);
      }
    }, 300);
  };

  const handleStopNavi = async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {
      // noop
    }
    await clearCurrentIndependentRoute();
    setShowNaviView(false);
  };

  if (showNaviView) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '独立避让路线模拟导航' }} />
        <NaviView
          ref={naviRef}
          style={styles.naviView}
          naviType={1}
          enableVoice={true}
          showCamera={true}
          onNaviEnd={(e) => {
            Alert.alert('导航结束', e.nativeEvent.reason || '已结束');
            void clearCurrentIndependentRoute();
            setShowNaviView(false);
          }}
          onArrive={() => {
            Alert.alert('到达目的地', '模拟导航完成');
            void clearCurrentIndependentRoute();
            setShowNaviView(false);
          }}
        />
        <TouchableOpacity style={styles.exitButton} onPress={handleStopNavi}>
          <Text style={styles.exitButtonText}>退出导航</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '道路/区域避让导航示例' }} />

      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.912, longitude: 116.411 },
          zoom: 14,
        }}
      >
        <Marker position={DEFAULT_FROM} title="起点" />
        <Marker position={DEFAULT_TO} title="终点" />

        <Polygon
          points={previewPoints}
          strokeColor="rgba(244,67,54,0.95)"
          fillColor="rgba(244,67,54,0.25)"
          strokeWidth={2}
        />

        {routePoints.length > 1 ? (
          <Polyline
            points={routePoints}
            strokeColor="#1E88E5"
            strokeWidth={7}
            zIndex={10}
          />
        ) : null}
      </MapView>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.panelTitle}>自定义道路避让</Text>
        <TextInput
          value={avoidRoad}
          onChangeText={setAvoidRoad}
          style={styles.input}
          placeholder="输入要避让的道路名（如：长安街）"
        />

        <Text style={styles.panelTitle}>自定义避让区域（每行：纬度,经度）</Text>
        <TextInput
          value={polygonText}
          onChangeText={setPolygonText}
          style={[styles.input, styles.multiInput]}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
          disabled={loading}
          onPress={handlePlanRoute}
        >
          <Text style={styles.buttonText}>{loading ? '规划中...' : '规划独立避让路线'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleStartSimulatedNavi}
        >
          <Text style={styles.buttonText}>按独立路线打开导航界面（模拟导航）</Text>
        </TouchableOpacity>

        {routeSummary ? <Text style={styles.summary}>{routeSummary}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  map: {
    flex: 1,
  },
  panel: {
    maxHeight: 320,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  panelContent: {
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1f24',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  multiInput: {
    minHeight: 92,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  successButton: {
    backgroundColor: '#2e7d32',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
    marginTop: 4,
  },
  naviView: {
    flex: 1,
  },
  exitButton: {
    position: 'absolute',
    right: 16,
    top: 56,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
