# Expo 高德地图导航示例 (Expo Gaode Map Navigation Example)

这是一个基于 Expo 的高德地图导航完整使用示例项目，展示了如何在 React Native 应用中集成和使用 `expo-gaode-map-navigation` 进行地图导航和路径规划。

## 📦 项目概述

本项目是 `expo-gaode-map-navigation` 和 `expo-gaode-map-web-api` 的综合示例，重点展示了：
*   原生导航组件的使用
*   路径规划（驾车、步行、骑行）
*   多策略路线对比
*   导航视图自定义
*   Web API 路径规划集成

## 🚀 主要功能

### 导航功能
- ✅ **基础导航**：完整的路径规划、模拟导航演示、轨迹动画
- 🚗 **多路径规划**：支持计算并对比多条路线（最快、最短、少收费、少高速等）
- 🗺️ **导航视图**：集成 `NaviView` 组件，提供原生的导航 UI 体验
- 🌐 **Web API 集成**：演示如何使用 Web API 进行路径规划并展示在地图上
- 📍 **独立路由**：展示独立的路由规划功能

## 🛠️ 技术栈

- **Expo SDK**: ~54.0.31
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo Router**: ~6.0.21
- **TypeScript**: ~5.9.2

### 核心依赖库

- `expo-gaode-map-navigation`: ^1.1.4 - 高德地图导航核心库（原生）
- `expo-gaode-map-web-api`: ^1.1.4 - 高德地图 Web API 接口封装
- `react-native-reanimated`: ~4.1.1 - 动画支持
- `sonner-native`: ^0.21.2 - Toast 提示

## 📋 环境要求

- Node.js 18+
- Expo CLI
- iOS 开发需要 Xcode (仅支持真机调试导航功能)
- Android 开发需要 Android Studio

## 🔧 安装配置

### 1. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

### 2. 配置高德地图 API Key

在使用本示例前，你需要前往 [高德开放平台](https://console.amap.com/) 申请 API Key。

#### 配置方式

**方式一：通过 app.json 配置（原生 SDK）**

在 `app.json` 或 `app.config.ts` 中配置插件：

```json
{
  "plugins": [
    [
      "expo-gaode-map-navigation",
      {
        "iosKey": "你的iOS Key",
        "androidKey": "你的Android Key",
        "enableLocation": true,
        "locationDescription": "我们需要访问您的位置信息以提供导航服务",
        "enableBackgroundLocation": true
      }
    ]
  ]
}
```

**方式二：配置 Web API Key**

如果使用 Web API 功能，建议在 `.env` 文件中配置：

```env
EXPO_PUBLIC_AMAP_WEB_KEY=你的Web服务Key
```

### 3. 预构建 (Prebuild)

由于使用了原生代码插件，必须执行预构建：

```bash
# iOS
npx expo prebuild --platform ios

# Android
npx expo prebuild --platform android
```

## 🚀 运行项目

```bash
# 启动开发服务器
npx expo start

# 运行 iOS (需使用开发构建 Development Build)
npx expo run:ios

# 运行 Android (需使用开发构建 Development Build)
npx expo run:android
```

> **注意**：由于包含原生导航模块，本示例**无法**直接在 Expo Go 中运行，必须使用 `npx expo run:ios` 或 `npx expo run:android` 编译自定义客户端。

## 📁 项目结构

```
expo-gaode-map-navigation-example/
├── app/                          # 应用页面
│   ├── BasicNavigationTest.tsx   # 基础导航示例（路径规划、动画、模拟导航）
│   ├── MultiRouteExample.tsx     # 多路径规划示例（对比不同策略路线）
│   ├── WebAPINavigationTest.tsx  # Web API 路径规划示例
│   ├── NaviViewExample.tsx       # 导航视图组件示例
│   ├── IndependentRouteExample.tsx # 独立路由示例
│   ├── SimpleNaviTest.tsx        # 简单导航测试
│   ├── _layout.tsx               # 路由布局
│   └── index.tsx                 # 首页入口
├── components/                   # 公共组件
├── constants/                    # 常量配置
├── assets/                       # 资源文件
└── package.json                  # 项目依赖
```

## 💡 主要功能说明

### 1. 基础导航 (`BasicNavigationTest.tsx`)
演示了最核心的导航流程：
*   获取当前位置
*   发起路径规划（驾车/步行/骑行）
*   在地图上绘制路线 (`Polyline`)
*   使用 `react-native-reanimated` 实现轨迹动画
*   启动模拟导航

### 2. 多路径规划 (`MultiRouteExample.tsx`)
展示如何一次性请求多条路线策略：
*   支持策略：最快、少收费、最短、少高速等
*   在地图上同时展示多条路线，并用不同颜色区分
*   点击切换当前选中的路线

### 3. Web API 路径规划 (`WebAPINavigationTest.tsx`)
演示如何在不依赖原生导航 SDK 的情况下，使用 Web API 获取路径数据：
*   使用 `expo-gaode-map-web-api` 发起请求
*   解析返回的路径点坐标
*   在地图上绘制

### 4. 导航组件 (`NaviViewExample.tsx`)
展示 `NaviView` 组件的集成，提供嵌入式的导航 UI 体验。

## 🔐 隐私合规

在使用高德地图 SDK 之前，请确保应用已获得用户的隐私授权，并符合相关法律法规要求。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
