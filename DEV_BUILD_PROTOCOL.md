# Local Development Build Protocol

**Refrence this document BEFORE every local build.**

## 1. Environment Verification
Before starting any build, verify the environment variables in your terminal (PowerShell).

**Required Variables:**
```powershell
$env:ANDROID_HOME = "F:\Gradle\SDK"
$env:GRADLE_USER_HOME = "D:\GradleCache"
# Verify
echo $env:ANDROID_HOME
echo $env:GRADLE_USER_HOME
```

## 2. Emulator Prep
Ensure the emulator is running and visible to ADB **before** triggering the build.

1.  **List AVDs:**
    ```powershell
    F:\Gradle\SDK\emulator\emulator -list-avds
    ```
2.  **Launch Emulator:**
    ```powershell
    F:\Gradle\SDK\emulator\emulator -avd Medium_Phone_API_35_2
    ```
3.  **Verify Connection:**
    ```powershell
    F:\Gradle\SDK\platform-tools\adb devices
    # Must show: emulator-xxxx device
    ```

## 3. Build & Launch Command
Use `npx` directly to avoid npm argument parsing errors.

**Correct Command:**
```powershell
$env:ANDROID_HOME="F:\Gradle\SDK"; $env:GRADLE_USER_HOME="D:\GradleCache"; npx expo run:android --port 8081
```

**Do NOT Use:**
- `npm run android` (unless passing args with `--`: `npm run android -- --port 8081`) - easy to mess up.
- `expo run:android` (without npx) - ensure local version is used.

## 4. Troubleshooting & Recursive Error Prevention

### "Native module not found" / "Unresolved reference"
**Solution:** The native build is stale.
1.  Stop Metro Bundler.
2.  Clean Android Build:
    ```powershell
    cd android
    ./gradlew clean
    cd ..
    ```
3.  Re-run the Build Command (Step 3).

### "SDK not found" / "local.properties missing"
**Solution:** Ensure `android/local.properties` exists.
- Content:
  ```properties
  sdk.dir=F:\\Gradle\\SDK
  ```
- *Note: Windows paths in properties files need double backslashes.*

### 6. MinSdkVersion Conflict (Health Connect)
**Error:** `Manifest merger failed : uses-sdk:minSdkVersion 24 cannot be smaller than version 26 declared in library [androidx.health.connect:connect-client:...]`
**Fix:**
1. Open `android/app/build.gradle`.
2. Find `minSdkVersion rootProject.ext.minSdkVersion`.
3. Change it to: `minSdkVersion 26`.
4. Clean and rebuild.

### 7. HeadlessJsTaskService Compilation Error
**Error:** `'getTaskConfig' overrides nothing` or signature mismatch in `WidgetHeadlessTaskService.kt`.
**Fix:**
Ensure the signature matches the nullable Intent:
```kotlin
override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val extras = intent?.extras
    if (extras != null) { ... }
    return null
}
```
**Note:** `intent` must be `Intent?` and `extras` access must be safe (`?.`).

### Gradle Hangs / "Installing NDK..."
**Solution:**
- **WAIT.** Creating the native build for the first time or after a clean takes time (can be >10 mins).
- Check `launch_summary.md` (or similar logs) to confirm it's actually doing something.
- Do not kill the process unless it has been silent for >15 minutes.

## 5. Testing Heavy Sleeper Mode (Fullscreen Alarms)

After building, test the Heavy Sleeper fullscreen alarm functionality:

### Required Permissions
Navigate to Android Settings and enable:
1. **Alarms & Reminders** (Android 12+):
   - Settings → Apps → Special App Access → Alarms & reminders → Follo → Allow
2. **Full Screen Intents** (Android 14+):
   - Settings → Apps → Special App Access → Full screen intents → Follo → Allow
3. **Do Not Disturb Access**:
   - Settings → Apps → Special App Access → Do Not Disturb Access → Follo → Allow
4. **Display over other apps**:
   - Settings → Apps → Special App Access → Display over other apps → Follo → Allow

### Testing Procedure
1. Open Follo → Settings → Notification Mode → Select "Heavy Sleeper"
2. Add/edit medication with time set to 2 minutes from now
3. **Lock the device** or press home button
4. Wait for alarm time
5. **Expected**: Screen wakes, fullscreen red alarm appears, sound plays
6. Verify slide-to-take gesture works

### Debugging Logs
View notification logs with:
```powershell
F:\Gradle\SDK\platform-tools\adb logcat | Select-String -Pattern "NotificationService|FullScreenIntent|AlarmScreen"
```

## 6. Post-Build
- Update `task_tracker.md` with the successful build status.
- Log any new "gotchas" encountered to this file.

---

### Build Log

| Date | Result | Notes |
|------|--------|-------|
| 2026-02-15 | ✅ SUCCESS | Fixed Notifee Maven repo (see §4.8). Native compile ~5min, Metro bundle OK. |

### 8. Notifee `app.notifee:core:+` Resolution Failure
**Error:** `Could not find any matches for app.notifee:core:+ as no versions of app.notifee:core are available.`
**Fix:**
Ensure `android/build.gradle` `allprojects.repositories` includes the Notifee local Maven repo:
```gradle
allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
    maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }
  }
}
```
