# ImaginReader - Text-to-Image EPUB Reader

ImaginReader is a React Native application designed for reading EPUB books and generating images from selected text. It features a bookshelf for managing your library and a reader interface for a comfortable reading experience.

## Features

- **Text-to-Image Generation**: Select text and generate visualizations.
- **Bookshelf**: Organize and view your collection of books.
- **EPUB Reader**: Read EPUB files with a custom parser and rendering engine.
- **File Management**: Import books from your device using document picker.
- **Cross-Platform**: Runs on both Android and iOS.

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
    git clone https://github.com/NoReasonThink/MyFirstApp.git
    cd MyFirstApp
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
