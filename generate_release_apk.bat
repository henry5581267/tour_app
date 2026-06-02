@echo off
set ROOT=%~dp0
set APK_SRC=%ROOT%android\app\build\outputs\apk\release\app-release.apk

:: Get git short hash for version
for /f "tokens=*" %%i in ('git -C "%ROOT%" rev-parse --short HEAD') do set GIT_HASH=%%i
set APK_NAME=tour_app-%GIT_HASH%.apk
set APK_DST=%ROOT%release\%APK_NAME%

echo [1/2] Building APK... (version: %GIT_HASH%)
cd "%ROOT%android"
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo Build FAILED
    pause
    exit /b 1
)

echo [2/2] Copying APK...
if not exist "%ROOT%release" mkdir "%ROOT%release"
copy "%APK_SRC%" "%APK_DST%"
if errorlevel 1 (
    echo Copy FAILED - source: %APK_SRC%
) else (
    echo Done: %APK_DST%
)
pause
