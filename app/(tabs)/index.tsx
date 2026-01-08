
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Test() {


   //使用地图要默认同意隐私协议
   useEffect(() => {
        ExpoGaodeMapModule.updatePrivacyCompliance(true)
        ExpoGaodeMapModule.initSDK({
            androidKey: '778e16e599e6f597b34a42a1ade6293c',
            iosKey: '9351998da2590b73e8ec9b9cec1240c7',
            webKey: '', // 可选，使用 Web API 服务时需要
        });
        //安卓获取定位权限
       ExpoGaodeMapModule.requestLocationPermission()

   }, []);

    return <View style={styles.container}>
        {/* <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#2196F3' }]}
            onPress={() => {router.push('/IndependentRouteExample')}}
        >
            <Text style={styles.exampleButtonText}>🧭 路线规划</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#1976D2' }]}
            onPress={() => router.push('/NaviViewExample')}
        >
            <Text style={styles.exampleButtonText}>🗺️ 导航界面</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
            onPress={() => router.push('/BasicNavigationTest')}
        >
            <Text style={styles.exampleButtonText}>🧭 原生sdk路线规划</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => router.push('/MultiRouteExample')}
        >
            <Text style={styles.exampleButtonText}>🛣️ 原生sdk多路线选择</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FFEB3B' }]}
            onPress={() => router.push('/WebAPINavigationTest')}
        >
            <Text style={styles.exampleButtonText}>web API 路线规划</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: 'red' }]}
            onPress={() => router.push('/MultiRouteExampleWebAPI')}
        >
            <Text style={styles.exampleButtonText}>web API 多线路选择</Text>
        </TouchableOpacity>
        
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap:20
    },
    exampleButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    exampleButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
      switchButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 15,
    zIndex: 1000,
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
})