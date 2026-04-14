import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
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

  // 页面类型与算路类型
  const [pageType, setPageType] = useState<'ROUTE' | 'NAVI'>('NAVI');
  const [officialNaviType, setOfficialNaviType] = useState<'DRIVER' | 'WALK' | 'RIDE' | 'MOTORCYCLE'>('DRIVER');

  // 常用参数
  const [theme, setTheme] = useState<ThemeType>('BLUE');
  const [routeStrategy, setRouteStrategy] = useState('10');
  const [naviMode, setNaviMode] = useState(Platform.OS === 'ios' ? '1' : '2'); // iOS 官方组件仅支持 1
  const [dayAndNightMode, setDayAndNightMode] = useState('0');
  const [broadcastMode, setBroadcastMode] = useState('2');
  const [carDirectionMode, setCarDirectionMode] = useState('2');
  const [mapViewModeType, setMapViewModeType] = useState('');
  const [broadcastType, setBroadcastType] = useState('');
  const [trackingMode, setTrackingMode] = useState('');
  const [onlineCarHailingType, setOnlineCarHailingType] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');

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
  const [needDestroyDriveManagerInstanceWhenNaviExit, setNeedDestroyDriveManagerInstanceWhenNaviExit] = useState(true);
  const [useInnerVoice, setUseInnerVoice] = useState(true);
  const [secondActionVisible, setSecondActionVisible] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(true);
  const [truckMultipleRouteNaviMode, setTruckMultipleRouteNaviMode] = useState(false);
  const [showNextRoadInfo, setShowNextRoadInfo] = useState(false);
  const [showBackupRoute, setShowBackupRoute] = useState(true);
  const [showRestrictareaEnable, setShowRestrictareaEnable] = useState(false);
  const [removePolylineAndVectorlineWhenArrivedDestination, setRemovePolylineAndVectorlineWhenArrivedDestination] =
    useState(false);
  const [showCameraDistanceEnable, setShowCameraDistanceEnable] = useState(false);
  const [, requestPermission] = useLocationPermissions();

  // 车辆参数
  const [carType, setCarType] = useState('0');
  const [carNumber, setCarNumber] = useState('');
  const [restriction, setRestriction] = useState(true);
  const [motorcycleCC, setMotorcycleCC] = useState('');
  const [vehicleAxis, setVehicleAxis] = useState('');
  const [vehicleHeight, setVehicleHeight] = useState('');
  const [vehicleLength, setVehicleLength] = useState('');
  const [vehicleWidth, setVehicleWidth] = useState('');
  const [vehicleSize, setVehicleSize] = useState('');
  const [vehicleLoad, setVehicleLoad] = useState('');
  const [vehicleWeight, setVehicleWeight] = useState('');
  const [vehicleLoadSwitch, setVehicleLoadSwitch] = useState(false);
  const [isLoadIgnore, setIsLoadIgnore] = useState(false);

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

  const toNumberOrUndefined = (value: string): number | undefined => {
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
      const mapViewModeTypeValue = toIntOrUndefined(mapViewModeType);
      const broadcastTypeValue = toIntOrUndefined(broadcastType);
      const trackingModeValue = toIntOrUndefined(trackingMode);
      const onlineCarHailingTypeValue = toIntOrUndefined(onlineCarHailingType);
      const scaleFactorValue = toNumberOrUndefined(scaleFactor);
      const motorcycleCCValue = toIntOrUndefined(motorcycleCC);

      const carInfo: OfficialNaviPageOptions['carInfo'] = {
        restriction,
      };
      if (carType.trim()) carInfo.carType = carType.trim();
      if (carNumber.trim()) carInfo.carNumber = carNumber.trim();
      if (motorcycleCCValue !== undefined) carInfo.motorcycleCC = motorcycleCCValue;
      if (vehicleAxis.trim()) carInfo.vehicleAxis = vehicleAxis.trim();
      if (vehicleHeight.trim()) carInfo.vehicleHeight = vehicleHeight.trim();
      if (vehicleLength.trim()) carInfo.vehicleLength = vehicleLength.trim();
      if (vehicleWidth.trim()) carInfo.vehicleWidth = vehicleWidth.trim();
      if (vehicleSize.trim()) carInfo.vehicleSize = vehicleSize.trim();
      if (vehicleLoad.trim()) carInfo.vehicleLoad = vehicleLoad.trim();
      if (vehicleWeight.trim()) carInfo.vehicleWeight = vehicleWeight.trim();
      carInfo.vehicleLoadSwitch = vehicleLoadSwitch;
      carInfo.isLoadIgnore = isLoadIgnore;

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
        pageType,
        officialNaviType,
        startNaviDirectly,
        needCalculateRouteWhenPresent,
        needDestroyDriveManagerInstanceWhenNaviExit,
        useInnerVoice,
        theme,
        trafficEnabled,
        showCrossImage,
        showRouteStrategyPreferenceView,
        showEagleMap,
        scaleAutoChangeEnable,
        multipleRouteNaviMode,
        truckMultipleRouteNaviMode,
        showExitNaviDialog,
        secondActionVisible,
        showVoiceSettings,
        showNextRoadInfo,
        showBackupRoute,
        showRestrictareaEnable,
        removePolylineAndVectorlineWhenArrivedDestination,
        showCameraDistanceEnable,
        routeStrategy: routeStrategyValue,
        naviMode: naviModeValue,
        dayAndNightMode: dayAndNightModeValue,
        broadcastMode: broadcastModeValue,
        carDirectionMode: carDirectionModeValue,
        mapViewModeType: mapViewModeTypeValue,
        broadcastType: broadcastTypeValue,
        trackingMode: trackingModeValue,
        onlineCarHailingType: onlineCarHailingTypeValue,
        scaleFactor: scaleFactorValue,
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
        <Text style={styles.title}>直进导航参数面板</Text>
        <Text style={styles.subtitle}>
          只走“直接导航”模式，不进入官方路线规划页。你在此页选择或填写的参数会一次性传入启动导航。
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
            {([
              { value: 'NAVI', label: '直接导航页' },
              { value: 'ROUTE', label: '路线规划页' },
            ] as Array<{ value: 'NAVI' | 'ROUTE'; label: string }>).map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.themeChip,
                  pageType === item.value ? styles.themeChipActive : undefined,
                ]}
                onPress={() => setPageType(item.value)}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    pageType === item.value ? styles.themeChipTextActive : undefined,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.themeRow}>
            {([
              { value: 'DRIVER', label: '驾车' },
              { value: 'WALK', label: '步行' },
              { value: 'RIDE', label: '骑行' },
              { value: 'MOTORCYCLE', label: '摩托车' },
            ] as Array<{ value: 'DRIVER' | 'WALK' | 'RIDE' | 'MOTORCYCLE'; label: string }>).map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.themeChip,
                  officialNaviType === item.value ? styles.themeChipActive : undefined,
                ]}
                onPress={() => setOfficialNaviType(item.value)}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    officialNaviType === item.value ? styles.themeChipTextActive : undefined,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.themeRow}>
            {([
              { value: 'BLUE', label: '蓝色主题' },
              { value: 'WHITE', label: '浅色主题' },
              { value: 'BLACK', label: '深色主题' },
            ] as Array<{ value: ThemeType; label: string }>).map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.themeChip,
                  theme === item.value ? styles.themeChipActive : undefined,
                ]}
                onPress={() => setTheme(item.value)}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    theme === item.value ? styles.themeChipTextActive : undefined,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ParamRow
            label="路线规划策略"
            value={routeStrategy}
            onChangeText={setRouteStrategy}
            placeholder="例如 10"
          />
          <ParamRow
            label="导航模式（1 实时导航 / 2 模拟导航，iOS官方模式仅支持1）"
            value={naviMode}
            onChangeText={setNaviMode}
            placeholder="2"
          />
          <ParamRow
            label="昼夜模式（0 自动 / 1 白天 / 2 夜间）"
            value={dayAndNightMode}
            onChangeText={setDayAndNightMode}
            placeholder="0"
          />
          <ParamRow
            label="语音播报模式（1 简洁 / 2 详细 / 3 静音）"
            value={broadcastMode}
            onChangeText={setBroadcastMode}
            placeholder="2"
          />
          <ParamRow
            label="地图朝向（1 正北朝上 / 2 车头朝上）"
            value={carDirectionMode}
            onChangeText={setCarDirectionMode}
            placeholder="2"
          />
          <ParamRow
            label="iOS 地图模式 mapViewModeType（可选）"
            value={mapViewModeType}
            onChangeText={setMapViewModeType}
            placeholder="0 白天 / 1 夜间 / 2 自动"
          />
          <ParamRow
            label="iOS 播报类型 broadcastType（可选）"
            value={broadcastType}
            onChangeText={setBroadcastType}
            placeholder="0 详细 / 1 简洁 / 2 静音"
          />
          <ParamRow
            label="iOS 跟随模式 trackingMode（可选）"
            value={trackingMode}
            onChangeText={setTrackingMode}
            placeholder="0 正北 / 1 车头"
          />
          <ParamRow
            label="iOS 网约车类型 onlineCarHailingType（可选）"
            value={onlineCarHailingType}
            onChangeText={setOnlineCarHailingType}
            placeholder="例如 0"
          />
          <ParamRow
            label="iOS 缩放比例 scaleFactor（可选）"
            value={scaleFactor}
            onChangeText={setScaleFactor}
            placeholder="例如 1.0"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>开关参数</Text>
          <SwitchRow label="直接进入导航界面" value={startNaviDirectly} onValueChange={setStartNaviDirectly} />
          <SwitchRow
            label="进入时自动算路"
            value={needCalculateRouteWhenPresent}
            onValueChange={setNeedCalculateRouteWhenPresent}
          />
          <SwitchRow
            label="退出时销毁导航实例"
            value={needDestroyDriveManagerInstanceWhenNaviExit}
            onValueChange={setNeedDestroyDriveManagerInstanceWhenNaviExit}
          />
          <SwitchRow label="使用内置语音" value={useInnerVoice} onValueChange={setUseInnerVoice} />
          <SwitchRow label="显示实时路况" value={trafficEnabled} onValueChange={setTrafficEnabled} />
          <SwitchRow label="显示路口放大图" value={showCrossImage} onValueChange={setShowCrossImage} />
          <SwitchRow
            label="显示策略偏好面板"
            value={showRouteStrategyPreferenceView}
            onValueChange={setShowRouteStrategyPreferenceView}
          />
          <SwitchRow
            label="显示下下个路口（Android）"
            value={secondActionVisible}
            onValueChange={setSecondActionVisible}
          />
          <SwitchRow
            label="显示语音设置（Android）"
            value={showVoiceSettings}
            onValueChange={setShowVoiceSettings}
          />
          <SwitchRow label="显示鹰眼小地图" value={showEagleMap} onValueChange={setShowEagleMap} />
          <SwitchRow
            label="自动缩放地图比例尺"
            value={scaleAutoChangeEnable}
            onValueChange={setScaleAutoChangeEnable}
          />
          <SwitchRow
            label="启用多路线导航模式"
            value={multipleRouteNaviMode}
            onValueChange={setMultipleRouteNaviMode}
          />
          <SwitchRow
            label="启用货车多路线模式"
            value={truckMultipleRouteNaviMode}
            onValueChange={setTruckMultipleRouteNaviMode}
          />
          <SwitchRow
            label="显示退出导航确认弹窗"
            value={showExitNaviDialog}
            onValueChange={setShowExitNaviDialog}
          />
          <SwitchRow label="显示随后转向信息" value={showNextRoadInfo} onValueChange={setShowNextRoadInfo} />
          <SwitchRow label="显示备选路线（iOS）" value={showBackupRoute} onValueChange={setShowBackupRoute} />
          <SwitchRow
            label="显示限行图层（iOS）"
            value={showRestrictareaEnable}
            onValueChange={setShowRestrictareaEnable}
          />
          <SwitchRow
            label="到达后移除路线（iOS）"
            value={removePolylineAndVectorlineWhenArrivedDestination}
            onValueChange={setRemovePolylineAndVectorlineWhenArrivedDestination}
          />
          <SwitchRow
            label="显示电子眼距离（iOS）"
            value={showCameraDistanceEnable}
            onValueChange={setShowCameraDistanceEnable}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>车辆参数</Text>
          <ParamRow label="车辆类型" value={carType} onChangeText={setCarType} placeholder="0 小客车 / 1 货车" />
          <ParamRow label="车牌号" value={carNumber} onChangeText={setCarNumber} placeholder="京A12345（可选）" />
          <ParamRow label="摩托车排量 motorcycleCC" value={motorcycleCC} onChangeText={setMotorcycleCC} placeholder="例如 250" />
          <SwitchRow label="考虑尾号限行" value={restriction} onValueChange={setRestriction} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>车辆高级参数（货车/可选）</Text>
          <ParamRow label="货车轴数 vehicleAxis" value={vehicleAxis} onChangeText={setVehicleAxis} placeholder="例如 2" />
          <ParamRow label="货车高度 vehicleHeight（米）" value={vehicleHeight} onChangeText={setVehicleHeight} placeholder="例如 3.5" />
          <ParamRow label="货车长度 vehicleLength（米）" value={vehicleLength} onChangeText={setVehicleLength} placeholder="例如 10.0" />
          <ParamRow label="货车宽度 vehicleWidth（米）" value={vehicleWidth} onChangeText={setVehicleWidth} placeholder="例如 2.5" />
          <ParamRow label="货车尺寸等级 vehicleSize" value={vehicleSize} onChangeText={setVehicleSize} placeholder="例如 3" />
          <ParamRow label="货车载重 vehicleLoad（吨）" value={vehicleLoad} onChangeText={setVehicleLoad} placeholder="例如 8" />
          <ParamRow label="货车总重 vehicleWeight（吨）" value={vehicleWeight} onChangeText={setVehicleWeight} placeholder="例如 12" />
          <SwitchRow
            label="vehicleLoadSwitch（启用载重）"
            value={vehicleLoadSwitch}
            onValueChange={setVehicleLoadSwitch}
          />
          <SwitchRow label="isLoadIgnore（忽略重量）" value={isLoadIgnore} onValueChange={setIsLoadIgnore} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>高级参数（JSON，可选）</Text>
          <Text style={styles.tipText}>
            会合并到最终启动参数，可覆盖上面所有字段。仅支持 JSON 对象。
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
    flexWrap: 'wrap',
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
