# ImaginReader (绘读) - AI 文生图 EPUB 阅读器

ImaginReader (绘读) 是一款创新的 React Native 应用程序，旨在连接文字与想象。它不仅是一个强大的 EPUB 阅读器，还能利用先进的 AI 技术，根据您选中的文字直接生成图像，为您带来可视化的沉浸式阅读体验。

## 主要特性 (Features)

- **AI 文生图 (Text-to-Image)**: 利用先进的 AI 模型，将您选中的文字片段瞬间转化为生动的图像，让故事跃然纸上。
- **智能书架**: 精美地管理、组织和展示您的数字藏书。
- **沉浸式阅读**: 专为舒适和专注设计的自定义 EPUB 解析与渲染引擎。
- **便捷文件管理**: 支持调用系统文件选择器，轻松从您的设备导入 EPUB 电子书。
- **跨平台支持**: 完美适配 Android 和 iOS 设备，提供流畅的体验。

## 技术栈 (Tech Stack)

- **React Native**: 0.83.1
- **React**: 19.2.0
- **Navigation**: React Navigation (Native Stack)
- **EPUB Parsing**: JSZip, @xmldom/xmldom
- **Storage**: @react-native-async-storage/async-storage
- **File System**: react-native-fs

## 快速开始 (Getting Started)

### 环境要求 (Prerequisites)

- [Node.js](https://nodejs.org/) (>=20)
- [React Native 开发环境搭建](https://reactnative.dev/docs/environment-setup)
- Android Studio / Xcode

### 安装步骤 (Installation)

1.  克隆仓库:
    ```bash
    git clone https://github.com/NoReasonThink/MyFirstApp.git
    cd MyFirstApp
    ```

2.  安装依赖:
    ```bash
    npm install
    ```

3.  启动 Metro Bundler:
    ```bash
    npm start
    ```

4.  在设备或模拟器上运行:
    - Android:
        ```bash
        npm run android
        ```
    - iOS:
        ```bash
        cd ios && pod install && cd ..
        npm run ios
        ```

## 项目结构 (Project Structure)

- `src/screens`: UI 界面 (书架、阅读器)。
- `src/services`: 业务逻辑与服务 (图像生成、设置)。
- `src/utils`: 工具函数 (Epub 解析器)。
- `src/types`: TypeScript 类型定义。
- `src/data`: 开发用模拟数据。

## 许可证 (License)

本项目采用 MIT 许可证。
