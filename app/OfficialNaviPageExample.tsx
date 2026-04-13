import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from 'sonner-native';

import { ExpoGaodeMapModule, OfficialNaviPageOptions, useLocationPermissions } from 'expo-gaode-map-navigation';

type LatLng = {
  latitude: number;
  longitude: number;
};

type ThemeType = 'BLUE' | 'WHITE' | 'BLACK';

function ParamRow({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.paramRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function OfficialNaviPageExample() {
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [opening, setOpening] = useState(false);

  // 常用参数
  const [theme, setTheme] = useState<ThemeType>('BLUE');
  const [routeStrategy, setRouteStrategy] = useState('10');
  const [naviMode, setNaviMode] = useState('2'); // Android: 2=模拟 1=GPS
  const [dayAndNightMode, setDayAndNightMode] = useState('0');
  const [broadcastMode, setBroadcastMode] = useState('2');
  const [carDirectionMode, setCarDirectionMode] = useState('2');

  // 开关参数
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [showCrossImage, setShowCrossImage] = useState(true);
  const [showRouteStrategyPreferenceView, setShowRouteStrategyPreferenceView] = useState(true);
  const [showEagleMap, setShowEagleMap] = useState(true);
  const [scaleAutoChangeEnable, setScaleAutoChangeEnable] = useState(true);
  const [multipleRouteNaviMode, setMultipleRouteNaviMode] = useState(true);
  const [showExitNaviDialog, setShowExitNaviDialog] = useState(true);
  const [startNaviDirectly, setStartNaviDirectly] = useState(true);
  const [needCalculateRouteWhenPresent, setNeedCalculateRouteWhenPresent] = useState(true);
  const [showNextRoadInfo, setShowNextRoadInfo] = useState(false);
  const [status, requestPermission] = useLocationPermissions();

  // 车辆参数
  const [carType, setCarType] = useState('0');
  const [carNumber, setCarNumber] = useState('');
  const [restriction, setRestriction] = useState(true);

  // 高级扩展：允许直接补充 JSON 参数（会 merge 到最终 options）
  const [extraJson, setExtraJson] = useState('{}');

  useEffect(()=>{
        //请求定位权限
        requestPermission();
      //ios用自带的导航 这个必须开启,info.plist中必须开启location background modes
        ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
        ExpoGaodeMapModule.setInterval(5000);
        ExpoGaodeMapModule.setDistanceFilter(10);
        ExpoGaodeMapModule.setDesiredAccuracy(3);
  },[])

  const destination = useMemo(
    () => ({
      latitude: 39.908823,
      longitude: 116.39747,
      name: '天安门',
    }),
    []
  );

  const getCurrentLocation = async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success('定位成功');
    } catch (error) {
      toast.error(`定位失败: ${String(error)}`);
    }
  };

  const toIntOrUndefined = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const openOfficialNaviDirectly = async () => {
    if (opening) return;
    setOpening(true);

    try {
      let extra: Record<string, any> = {};
      const trimmedExtra = extraJson.trim();
      if (trimmedExtra && trimmedExtra !== '{}') {
        try {
          const parsed = JSON.parse(trimmedExtra);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            extra = parsed;
          } else {
            throw new Error('extraJson 必须是 JSON 对象');
          }
        } catch (error) {
          Alert.alert('参数错误', `高级参数 JSON 解析失败: ${String(error)}`);
          return;
        }
      }

      const routeStrategyValue = toIntOrUndefined(routeStrategy);
      const naviModeValue = toIntOrUndefined(naviMode);
      const dayAndNightModeValue = toIntOrUndefined(dayAndNightMode);
      const broadcastModeValue = toIntOrUndefined(broadcastMode);
      const carDirectionModeValue = toIntOrUndefined(carDirectionMode);

      const carInfo: OfficialNaviPageOptions['carInfo'] = {
        restriction,
      };
      if (carType.trim()) carInfo.carType = carType.trim();
      if (carNumber.trim()) carInfo.carNumber = carNumber.trim();

      //参数配置
      const options: OfficialNaviPageOptions = {
        from: currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              name: '我的位置',
            }
          : undefined,
        to: destination,
        pageType: 'NAVI',
        officialNaviType: 'DRIVER',
        startNaviDirectly,
        needCalculateRouteWhenPresent,
        theme,
        trafficEnabled,
        showCrossImage,
        showRouteStrategyPreferenceView,
        showEagleMap,
        scaleAutoChangeEnable,
        multipleRouteNaviMode,
        showExitNaviDialog,
        showNextRoadInfo,
        routeStrategy: routeStrategyValue,
        naviMode: naviModeValue,
        dayAndNightMode: dayAndNightModeValue,
        broadcastMode: broadcastModeValue,
        carDirectionMode: carDirectionModeValue,
        carInfo,
        ...extra,
      };

      // Object.keys(options).forEach((key) => {
      //   if (options[key] === undefined) delete options[key];
      // });

      const success = await ExpoGaodeMapNavigation.openOfficialNaviPage(options);
      if (success) {
        toast.success('已按当前自定义参数启动导航');
      } else {
        toast.error('启动失败');
      }
    } catch (error) {
      console.error('启动导航失败:', error);
      Alert.alert('启动失败', String(error));
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '官方导航参数自定义' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>openOfficialNaviDirectly 参数面板</Text>
        <Text style={styles.subtitle}>
          只走“直接导航”模式，不进入官方路线规划页。你在此页选/填的参数会一次性传给
          `openOfficialNaviPage`。
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前位置</Text>
          <Text style={styles.locationText}>
            {currentLocation
              ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
              : '未获取（不传起点时使用“我的位置”）'}
          </Text>
          <Text style={styles.locationText}>
            终点：{destination.name}（{destination.latitude.toFixed(6)},{' '}
            {destination.longitude.toFixed(6)}）
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={getCurrentLocation}
          disabled={opening}
        >
          <Text style={styles.buttonText}>📍 获取当前位置</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>基础参数</Text>

          <View style={styles.themeRow}>
            {(['BLUE', 'WHITE', 'BLACK'] as ThemeType[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.themeChip,
                  theme === item ? styles.themeChipActive : undefined,
                ]}
                onPress={() => setTheme(item)}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    theme === item ? styles.themeChipTextActive : undefined,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ParamRow
            label="routeStrategy"
            value={routeStrategy}
            onChangeText={setRouteStrategy}
            placeholder="例如 10"
          />
          <ParamRow
            label="naviMode (安卓:1=GPS,2=模拟)"
            value={naviMode}
            onChangeText={setNaviMode}
            placeholder="2"
          />
          <ParamRow
            label="dayAndNightMode (0自动/1白天/2夜间)"
            value={dayAndNightMode}
            onChangeText={setDayAndNightMode}
            placeholder="0"
          />
          <ParamRow
            label="broadcastMode (1简洁/2详细/3静音)"
            value={broadcastMode}
            onChangeText={setBroadcastMode}
            placeholder="2"
          />
          <ParamRow
            label="carDirectionMode (1北向上/2车头向上)"
            value={carDirectionMode}
            onChangeText={setCarDirectionMode}
            placeholder="2"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>开关参数</Text>
          <SwitchRow label="startNaviDirectly" value={startNaviDirectly} onValueChange={setStartNaviDirectly} />
          <SwitchRow
            label="needCalculateRouteWhenPresent"
            value={needCalculateRouteWhenPresent}
            onValueChange={setNeedCalculateRouteWhenPresent}
          />
          <SwitchRow label="trafficEnabled" value={trafficEnabled} onValueChange={setTrafficEnabled} />
          <SwitchRow label="showCrossImage" value={showCrossImage} onValueChange={setShowCrossImage} />
          <SwitchRow
            label="showRouteStrategyPreferenceView"
            value={showRouteStrategyPreferenceView}
            onValueChange={setShowRouteStrategyPreferenceView}
          />
          <SwitchRow label="showEagleMap" value={showEagleMap} onValueChange={setShowEagleMap} />
          <SwitchRow
            label="scaleAutoChangeEnable"
            value={scaleAutoChangeEnable}
            onValueChange={setScaleAutoChangeEnable}
          />
          <SwitchRow
            label="multipleRouteNaviMode"
            value={multipleRouteNaviMode}
            onValueChange={setMultipleRouteNaviMode}
          />
          <SwitchRow
            label="showExitNaviDialog"
            value={showExitNaviDialog}
            onValueChange={setShowExitNaviDialog}
          />
          <SwitchRow label="showNextRoadInfo" value={showNextRoadInfo} onValueChange={setShowNextRoadInfo} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>车辆参数 carInfo</Text>
          <ParamRow label="carType" value={carType} onChangeText={setCarType} placeholder="0 小客车 / 1 货车" />
          <ParamRow label="carNumber" value={carNumber} onChangeText={setCarNumber} placeholder="京A12345（可选）" />
          <SwitchRow label="restriction" value={restriction} onValueChange={setRestriction} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>高级参数 JSON（可选）</Text>
          <Text style={styles.tipText}>
            会 merge 到最终 options，可覆盖上面所有字段。仅支持 JSON 对象。
          </Text>
          <TextInput
            style={styles.jsonInput}
            multiline
            value={extraJson}
            onChangeText={setExtraJson}
            placeholder='例如 {"truckMultipleRouteNaviMode":true}'
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.naviButton, opening && styles.disabledButton]}
          onPress={openOfficialNaviDirectly}
          disabled={opening}
        >
          <Text style={styles.buttonText}>
            {opening ? '启动中...' : '🧭 按当前参数直接启动导航'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  locationText: {
    fontSize: 13,
    color: '#374151',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
  },
  naviButton: {
    backgroundColor: '#0F766E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  paramRow: {
    gap: 6,
  },
  paramLabel: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  themeChipActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  themeChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  themeChipTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  jsonInput: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 12,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
});
