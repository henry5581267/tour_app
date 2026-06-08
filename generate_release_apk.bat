@echo off
set ROOT=%~dp0

:: Remove trailing backslash from ROOT for git -C
set ROOTDIR=%ROOT:~0,-1%

:: Get git short hash
for /f "tokens=*" %%i in ('git -C "%ROOTDIR%" rev-parse --short HEAD 2^>nul') do set GIT_HASH=%%i

if "%GIT_HASH%"=="" (
    echo WARNING: Could not get git hash, using 'unknown'
    set GIT_HASH=unknown
)

set APK_SRC=%ROOT%android\app\build\outputs\apk\release\app-release.apk
set APK_NAME=tour_app-%GIT_HASH%.apk
set APK_DST=%ROOT%release\%APK_NAME%

echo [1/3] Building APK... (version: %GIT_HASH%)
cd "%ROOT%android"
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo Build FAILED
    pause
    exit /b 1
)

echo [2/3] Copying APK...
if not exist "%ROOT%release" mkdir "%ROOT%release"
copy "%APK_SRC%" "%APK_DST%"
if errorlevel 1 (
    echo Copy FAILED - source: %APK_SRC%
    pause
    exit /b 1
)
echo Done: %APK_DST%
cd ..
echo [3/3] Uploading to Google Drive...
rclone copy "%APK_DST%" gdrive:TourApp_release --progress
if errorlevel 1 (
    echo Upload FAILED
) else (
    echo Uploaded: gdrive:TourApp_release/%APK_NAME%
)
pause
