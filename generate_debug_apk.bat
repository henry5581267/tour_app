@echo off
set ROOT=%~dp0
set APK_SRC=%ROOT%android\app\build\outputs\apk\debug\app-debug.apk
set APK_DST=%ROOT%debug\app-debug.apk

echo [1/2] Building APK...
cd "%ROOT%android"
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo Build FAILED
    pause
    exit /b 1
)

echo [2/2] Copying APK...
if not exist "%ROOT%debug" mkdir "%ROOT%debug"
copy "%APK_SRC%" "%APK_DST%"
if errorlevel 1 (
    echo Copy FAILED - source: %APK_SRC%
) else (
    echo Done: %APK_DST%
)
pause
