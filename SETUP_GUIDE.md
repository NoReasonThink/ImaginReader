# Android Development Setup Guide

You have successfully installed the basic tools (Node.js, JDK 17, Android Studio) and created a React Native project.
To fully run the application on Android, please follow these manual steps:

## 1. Finalize Android Studio Setup
1.  Open **Android Studio** from your Start Menu.
2.  On the first launch, a Setup Wizard will appear. Click **Next**.
3.  Select **Standard** installation type and click **Next**.
4.  Verify the settings and click **Next** (or Finish) to accept licenses.
    *   This step is crucial as it downloads the **Android SDK** and **Platform Tools**.
    *   Wait for the download to complete.

## 2. Configure Environment Variables
1.  Find your Android SDK path (usually shown during setup, typically `C:\Users\<YourUser>\AppData\Local\Android\Sdk`).
2.  Open Windows Search, type "Environment Variables", and select "Edit the system environment variables".
3.  Click **Environment Variables**.
4.  Under **User variables**, click **New**:
    *   Variable name: `ANDROID_HOME`
    *   Variable value: `C:\Users\<YourUser>\AppData\Local\Android\Sdk` (Adjust if different)
5.  Find the `Path` variable (in User or System variables), select it, and click **Edit**.
6.  Click **New** and add: `%ANDROID_HOME%\platform-tools`.
7.  Click **OK** to save everything.

## 3. Create an Android Virtual Device (Emulator)
1.  Open Android Studio.
2.  Click on **More Actions** (three dots) > **Virtual Device Manager** (or "Device Manager").
3.  Click **Create device**.
4.  Choose a phone (e.g., Pixel 7) and click **Next**.
5.  Select a System Image (e.g., Tiramisu or UpsideDownCake - API 33/34) and click **Download** (arrow icon).
6.  Once downloaded, select it and click **Next**, then **Finish**.
7.  Click the **Play** button to start the emulator.

## 4. Run the Application
1.  Open a terminal in this project folder (`D:\projects\technology\MyFirstApp`).
2.  Start the Metro Bundler:
    ```powershell
    npx react-native start
    ```
3.  In a **new** terminal window, build and run the Android app:
    ```powershell
    npx react-native run-android
    ```

Happy Coding!
