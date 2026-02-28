# ImaginReader (绘读) - Text-to-Image EPUB Reader

ImaginReader (Chinese: 绘读) is an innovative React Native application that bridges the gap between text and imagination. It serves as a robust EPUB reader while empowering users to visualize scenes by generating images directly from selected text.

## Features

- **AI-Powered Visualization**: Instantly generate vivid images from text selections using advanced AI models (Text-to-Image).
- **Smart Bookshelf**: Seamlessly organize, manage, and view your digital library.
- **Immersive EPUB Reader**: Enjoy a comfortable reading experience with a custom parsing and rendering engine.
- **Easy File Management**: Effortlessly import books from your device using the system document picker.
- **Cross-Platform**: Optimized performance and UI for both Android and iOS devices.

## Tech Stack

- **React Native**: 0.83.1
- **React**: 19.2.0
- **Navigation**: React Navigation (Native Stack)
- **EPUB Parsing**: JSZip, @xmldom/xmldom
- **Storage**: @react-native-async-storage/async-storage
- **File System**: react-native-fs

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>=20)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- Android Studio / Xcode

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/NoReasonThink/ImaginReader.git
    cd ImaginReader
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start Metro Bundler:
    ```bash
    npm start
    ```

4.  Run on Device/Emulator:
    - Android:
        ```bash
        npm run android
        ```
    - iOS:
        ```bash
        cd ios && pod install && cd ..
        npm run ios
        ```

## Project Structure

- `src/screens`: UI screens (Bookshelf, Reader).
- `src/services`: Business logic and services (ImageGeneration, Settings).
- `src/utils`: Utility functions (EpubParser).
- `src/types`: TypeScript definitions.
- `src/data`: Mock data for development.

## License

This project is licensed under the MIT License.
