import { useColorScheme } from "@/components/useColorScheme.web";
import { useIOSVersionNumber } from "@/hooks/useDeviceVersion";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function Layout() {

    const colorScheme = useColorScheme();
    const iosVersion = useIOSVersionNumber();
    
    // iOS 版本小于 18 才使用 headerBlurEffect
    const shouldUseBlurEffect = Platform.OS === 'ios' && iosVersion !== null && iosVersion < 26;

    return (
        <Stack screenOptions={{
            animation: 'ios_from_right',
            headerBackTitle: '返回',
            headerTransparent: Platform.OS === 'ios',
            headerBlurEffect: shouldUseBlurEffect ? (colorScheme === 'dark' ? 'dark' : 'light') : undefined,
            headerShadowVisible: false,
        }}>
            <Stack.Screen name="index" options={{
                title: '地图使用示例',
              

            }} />
            <Stack.Screen
                name="map"
                options={{
                    title: '',
                    // headerTransparent: true,
                }}
            />
            <Stack.Screen
                name='poiSearch'
                options={{
                    title: 'POI搜索',

                }}
            />
            <Stack.Screen
                name="poiSearchNativeExample"
                options={{
                    title: 'POI搜索示例(原生 SDK)',

                }}
            />
            <Stack.Screen
                name='poiMapSearch'
                options={{
                    title: '地图选点',
                }}
            />
            <Stack.Screen
                name="poiSearchMapNativeExample"
                options={{
                    title: '',

                }}
            />
            <Stack.Screen
                name='inputTips'
                options={{
                    title: '💡 输入提示',
                }}
            />
            <Stack.Screen
                name="addressPickerExample"
                options={{
                    title: '地址选择器示例(web-api)',

                }}
            />
            <Stack.Screen
                name="addressPickerNativeExample"
                options={{
                    title: '地址选择器示例(原生 SDK)',

                }}
            />
            <Stack.Screen
                name="routeExamples"
                options={{
                    title: '路径规划示例(web-api)',


                }}
            />
            <Stack.Screen
                name="bicyclingRouteExample"
                options={{
                    title: '🚴 骑行 & 电动车路径规划示例',

                }}
            />
            <Stack.Screen
                name="drivingRouteExample"
                options={{
                    title: '🚗 驾车路径规划示例',
                }}
            />
            <Stack.Screen
                name="transitRouteExample"
                options={{
                    title: '🚌 公交路径规划示例',
                }}
            />
            <Stack.Screen
                name="walkingRouteExample"
                options={{
                    title: '🚶 步行路径规划示例',
                }}
            />
            <Stack.Screen
                name="webAPINavigationTest"
                options={{ title: '' , headerTransparent: true,}}
            />
            
            <Stack.Screen
                name="geometryUtilsExample"
                options={{ title: '几何计算' ,headerTransparent:false }}
            />

            <Stack.Screen
                name="trackPlaybackExample"
                options={{ title: '轨迹回放示例' }}
            />

        
           <Stack.Screen
                name="navigationWithLocation"
                options={{ title: '路径规划与定位平滑移动示例' }}
            />

            <Stack.Screen
                name="taxiLocationPicker"
                options={{ title: '出租车上车点选择器/拖拽选点' }}
            />
            <Stack.Screen
                name="enterpriseCheckIn"
                options={{ title: '企微考勤打卡示例',  headerTransparent: false,}}
            />
            <Stack.Screen
                name='deliveryAddressPicker'
                options={{
                    title: '外卖选址',
                    headerTransparent: false,
                }}
            />
            <Stack.Screen
                name="deliveryRouteExample"
                options={{ title: '配送员路线视图(模拟)' }}
            />
        </Stack>
    )
}
