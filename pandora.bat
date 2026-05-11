@echo off
setlocal EnableDelayedExpansion
title Pandora

rem ============================================================
rem  Pandora -- Extension CLI
rem  Usage:
rem    pandora install
rem    pandora uninstall
rem    pandora update check
rem    pandora update install
rem    pandora help
rem ============================================================

set "GITHUB_USER=supernova0866"
set "GITHUB_REPO=Pandora.ext"
set "GITHUB_BRANCH=main"
set "RAW=https://raw.githubusercontent.com/%GITHUB_USER%/%GITHUB_REPO%/%GITHUB_BRANCH%"

set "CMD1=%~1"
set "CMD2=%~2"

if /i "!CMD1!"==""           goto :help
if /i "!CMD1!"=="help"       goto :help
if /i "!CMD1!"=="install"    goto :install
if /i "!CMD1!"=="uninstall"  goto :uninstall
if /i "!CMD1!"=="update" (
  if /i "!CMD2!"=="check"   goto :update_check
  if /i "!CMD2!"=="install" goto :update_install
  goto :bad_args
)
goto :bad_args

rem ============================================================
:help
cls
call :print_header
echo   COMMANDS:
echo.
echo     pandora install          Download and set up the extension
echo     pandora uninstall        Remove the extension files
echo     pandora update check     Check if a newer version is available
echo     pandora update install   Download and apply latest updates
echo     pandora help             Show this help screen
echo.
echo   FIRST TIME?
echo     Run:  pandora install
echo     Then load the extension folder in chrome://extensions
echo.
exit /b 0

rem ============================================================
:install
cls
call :print_header
echo   [ INSTALL ]
echo   -------------------------------------------------------------
echo.
call :require_powershell
echo   Where would you like to install Pandora?
echo   Press ENTER for default, or type a custom path.
echo   Default: %USERPROFILE%\Pandora
echo.
set /p "INSTALL_DIR=  Path: "
if "!INSTALL_DIR!"=="" set "INSTALL_DIR=%USERPROFILE%\Pandora"
if "!INSTALL_DIR:~-1!"=="\" set "INSTALL_DIR=!INSTALL_DIR:~0,-1!"
set "EXT_DIR=!INSTALL_DIR!\Pandora.ext"
echo.
echo   Installing to: !EXT_DIR!
echo.
mkdir "!EXT_DIR!\icons" 2>nul
set /a _c=0
set /a _f=0
call :download_file "ext/manifest.json"      "!EXT_DIR!\manifest.json"
call :download_file "ext/background.js"      "!EXT_DIR!\background.js"
call :download_file "ext/content.js"         "!EXT_DIR!\content.js"
call :download_file "ext/pandora.css"        "!EXT_DIR!\pandora.css"
call :download_file "ext/popup.html"         "!EXT_DIR!\popup.html"
call :download_file "ext/popup.js"           "!EXT_DIR!\popup.js"
call :download_file "ext/version.json"       "!EXT_DIR!\version.json"
call :download_file "ext/themes.json"        "!EXT_DIR!\themes.json"
call :download_file "ext/themes.css"         "!EXT_DIR!\themes.css"
call :download_file "ext/icons/icon16.png"   "!EXT_DIR!\icons\icon16.png"
call :download_file "ext/icons/icon48.png"   "!EXT_DIR!\icons\icon48.png"
call :download_file "ext/icons/icon128.png"  "!EXT_DIR!\icons\icon128.png"
echo !EXT_DIR!> "!INSTALL_DIR!\pandora_path.txt"
if "!_f!"=="0" goto :install_ok
echo.
echo   [!] !_f! file(s) failed to download. Check your connection.
echo.
echo   If you are behind a proxy or firewall, PowerShell may need
echo   proxy settings configured. Then run: pandora update install
pause & exit /b 1
:install_ok
echo.
echo   -------------------------------------------------------------
echo   [OK] Pandora installed -- !_c! files downloaded
echo   -------------------------------------------------------------
echo.
echo   NEXT STEPS:
echo.
echo    1. Open Chrome  ^>  chrome://extensions
echo    2. Enable  Developer mode  (top-right toggle)
echo    3. Click  Load unpacked
echo    4. Select this folder:
echo.
echo       !EXT_DIR!
echo.
echo    5. Pin Pandora from the puzzle piece icon
echo    6. Click it to set your PIN
echo.
echo   To update later:  pandora update install
echo.
set /p "_open=Open the extension folder now? (Y/N): "
if /i "!_open!"=="Y" explorer "!EXT_DIR!"
echo.
exit /b 0

rem ============================================================
:uninstall
cls
call :print_header
echo   [ UNINSTALL ]
echo   -------------------------------------------------------------
echo.
set "UNINST_EXT_DIR="
set "_pf=%~dp0pandora_path.txt"
if exist "!_pf!" (
  set /p "UNINST_EXT_DIR="<"!_pf!"
  goto :uninst_found
)
if exist "%USERPROFILE%\Pandora\pandora_path.txt" (
  set /p "UNINST_EXT_DIR="<"%USERPROFILE%\Pandora\pandora_path.txt"
  goto :uninst_found
)
echo   Could not find a Pandora installation to remove.
echo   If you installed to a custom location, delete the folder manually.
echo.
pause & exit /b 1
:uninst_found
for %%D in ("!UNINST_EXT_DIR!") do set "UNINST_PARENT=%%~dpD"
if "!UNINST_PARENT:~-1!"=="\" set "UNINST_PARENT=!UNINST_PARENT:~0,-1!"
echo   This will permanently delete the Pandora extension files:
echo.
echo     !UNINST_EXT_DIR!
echo     !UNINST_PARENT!\pandora_path.txt
echo.
echo   pandora.bat will NOT be deleted -- remove it manually if you want.
echo   You can run  pandora install  again at any time to reinstall.
echo.
echo   IMPORTANT: Remove the extension from Chrome first:
echo     chrome://extensions -- find Pandora -- click Remove
echo.
set /p "_confirm=Type YES to confirm uninstall: "
if /i not "!_confirm!"=="YES" (
  echo.
  echo   Uninstall cancelled.
  echo.
  exit /b 0
)
echo.
echo   Removing files...
if exist "!UNINST_EXT_DIR!" (
  rd /s /q "!UNINST_EXT_DIR!" 2>nul
  if exist "!UNINST_EXT_DIR!" (
    echo   [ERR] Could not delete: !UNINST_EXT_DIR!
    echo         It may be in use by Chrome. Close Chrome and try again.
    echo.
    pause & exit /b 1
  )
  echo   [DEL] !UNINST_EXT_DIR!
) else (
  echo   [???] Extension folder not found (may already be deleted)
)
if exist "!UNINST_PARENT!\pandora_path.txt" (
  del /q "!UNINST_PARENT!\pandora_path.txt" 2>nul
  echo   [DEL] !UNINST_PARENT!\pandora_path.txt
)
set "_parent_empty=1"
for /f %%F in ('dir /b /a "!UNINST_PARENT!" 2^>nul') do set "_parent_empty=0"
if "!_parent_empty!"=="1" (
  rd /q "!UNINST_PARENT!" 2>nul
  echo   [DEL] !UNINST_PARENT! (was empty)
) else (
  echo   [---] !UNINST_PARENT! kept (contains other files)
)
echo.
echo   -------------------------------------------------------------
echo   Pandora has been uninstalled.
echo   -------------------------------------------------------------
echo.
echo   pandora.bat is still at its current location.
echo   Run  pandora install  any time to reinstall.
echo.
exit /b 0

rem ============================================================
:update_check
cls
call :print_header
echo   [ UPDATE CHECK ]
echo   -------------------------------------------------------------
echo.
call :require_powershell
call :load_install_path
call :get_local_version "!EXT_DIR!\version.json"
call :get_remote_version
echo   Installed  :  v!LOCAL_VER!
echo   Available  :  v!REMOTE_VER!
echo.
if "!LOCAL_VER!"=="!REMOTE_VER!" (
  echo   You are up to date. No action needed.
) else (
  echo   Update available!
  echo   Run:  pandora update install
  if defined CHANGELOG echo.
  if defined CHANGELOG echo   What's new: !CHANGELOG!
)
echo.
exit /b 0

rem ============================================================
:update_install
cls
call :print_header
echo   [ UPDATE INSTALL ]
echo   -------------------------------------------------------------
echo.
call :require_powershell
call :load_install_path
call :get_local_version "!EXT_DIR!\version.json"
call :get_remote_version
echo   Installed  :  v!LOCAL_VER!
echo   Available  :  v!REMOTE_VER!
echo.
if "!LOCAL_VER!"=="!REMOTE_VER!" (
  echo   Already on the latest version.
  echo.
  set /p "_force=Force re-check all files anyway? (Y/N): "
  if /i not "!_force!"=="Y" ( echo. & exit /b 0 )
  echo.
)
echo   Scanning and syncing files...
echo.
echo   [NEW] = created    [UPD] = updated    [---] = unchanged    [ERR] = failed
echo   -------------------------------------------------------------------------
set /a UPDATED=0
set /a SKIPPED=0
set /a CREATED=0
set /a FAILED=0
call :smart_sync "ext/manifest.json"      "!EXT_DIR!\manifest.json"
call :smart_sync "ext/background.js"      "!EXT_DIR!\background.js"
call :smart_sync "ext/content.js"         "!EXT_DIR!\content.js"
call :smart_sync "ext/pandora.css"        "!EXT_DIR!\pandora.css"
call :smart_sync "ext/popup.html"         "!EXT_DIR!\popup.html"
call :smart_sync "ext/popup.js"           "!EXT_DIR!\popup.js"
call :smart_sync "ext/version.json"       "!EXT_DIR!\version.json"
call :smart_sync "ext/themes.json"        "!EXT_DIR!\themes.json"
call :smart_sync_themes_css
call :smart_sync "ext/icons/icon16.png"   "!EXT_DIR!\icons\icon16.png"
call :smart_sync "ext/icons/icon48.png"   "!EXT_DIR!\icons\icon48.png"
call :smart_sync "ext/icons/icon128.png"  "!EXT_DIR!\icons\icon128.png"
call :smart_sync_self
echo.
echo   -------------------------------------------------------------
echo   !CREATED! new   !UPDATED! updated   !SKIPPED! unchanged   !FAILED! failed
echo   -------------------------------------------------------------
echo.
if !UPDATED! gtr 0 (
  echo   Reload Pandora in Chrome to apply changes:
  echo    1. Go to chrome://extensions
  echo    2. Click the reload button on Pandora
  echo.
  set /p "_chrome=Open chrome://extensions now? (Y/N): "
  if /i "!_chrome!"=="Y" start chrome "chrome://extensions"
) else if !CREATED! gtr 0 (
  echo   New files added -- reload the extension in Chrome.
) else (
  echo   Everything is already up to date.
)
echo.
exit /b 0

rem ============================================================
:bad_args
echo.
echo   Unknown command: %*
echo   Run  pandora help  to see available commands.
echo.
exit /b 1

rem ============================================================
rem  SHARED SUBROUTINES
rem ============================================================

:print_header
echo.
echo   PANDORA  ^|  Extension Manager
echo.
goto :eof

rem -------------------------------------------------------------
:require_powershell
where powershell >nul 2>&1
if %errorlevel% neq 0 (
  echo   [ERROR] PowerShell is required but was not found.
  pause & exit /b 1
)
goto :eof

rem -------------------------------------------------------------
:load_install_path
set "EXT_DIR="
set "_pf=%~dp0pandora_path.txt"
if exist "!_pf!" (
  set /p "EXT_DIR="<"!_pf!"
  goto :lp_done
)
if exist "%USERPROFILE%\Pandora\pandora_path.txt" (
  set /p "EXT_DIR="<"%USERPROFILE%\Pandora\pandora_path.txt"
  goto :lp_done
)
echo   Could not find installation. Run:  pandora install
echo.
pause & exit /b 1
:lp_done
if not exist "!EXT_DIR!\manifest.json" (
  echo   [ERROR] manifest.json not found in: !EXT_DIR!
  echo   Run:  pandora install
  pause & exit /b 1
)
goto :eof

rem -------------------------------------------------------------
:get_local_version
set "LOCAL_VER=unknown"
if not exist "%~1" goto :eof
for /f "tokens=2 delims=:, " %%v in ('findstr /i "\"version\"" "%~1"') do (
  set "LOCAL_VER=%%~v" & goto :eof
)
goto :eof

rem -------------------------------------------------------------
:get_remote_version
set "REMOTE_VER=unknown"
set "CHANGELOG="
set "_tv=%TEMP%\pandora_ver_%RANDOM%.json"
powershell -NoProfile -NonInteractive -Command "try { Invoke-WebRequest -Uri '%RAW%/ext/version.json' -OutFile '%_tv%' -UseBasicParsing } catch { exit 1 }" 2>nul
if not exist "!_tv!" (
  echo   [ERROR] Cannot reach GitHub. Check your connection.
  pause & exit /b 1
)
for /f "tokens=2 delims=:, " %%v in ('findstr /i "\"version\"" "!_tv!"') do set "REMOTE_VER=%%~v"
for /f "tokens=2 delims=:" %%c in ('findstr /i "changelog" "!_tv!"') do set "CHANGELOG=%%~c"
del "!_tv!" 2>nul
goto :eof

rem -------------------------------------------------------------
:download_file
set "_src=%~1"
set "_dst=%~2"
set "_url=%RAW%/%~1"
echo   Downloading %~1...
powershell -NoProfile -NonInteractive -Command "try { Invoke-WebRequest -Uri '%_url%' -OutFile '%_dst%' -UseBasicParsing } catch { exit 1 }" 2>nul
if not exist "%~2" (
  echo   [ERR] %~1
  set /a _f+=1
) else (
  echo   [OK]
  set /a _c+=1
)
goto :eof

rem -------------------------------------------------------------
:smart_sync
set "_rel=%~1"
set "_dst=%~2"
set "_url=%RAW%/%~1"
set "_tmp=%TEMP%\pandora_sync_%RANDOM%_%RANDOM%"
powershell -NoProfile -NonInteractive -Command "try { Invoke-WebRequest -Uri '%_url%' -OutFile '%_tmp%' -UseBasicParsing } catch { exit 1 }" 2>nul
if not exist "!_tmp!" (
  echo   [ERR] !_rel!
  set /a FAILED+=1
  goto :eof
)
if not exist "!_dst!" (
  move /y "!_tmp!" "!_dst!" >nul 2>&1
  echo   [NEW] !_rel!
  set /a CREATED+=1
  goto :eof
)
for /f "usebackq delims=" %%H in (`powershell -NoProfile -NonInteractive -Command "if ((Get-FileHash '!_dst!' -Algorithm SHA256).Hash -eq (Get-FileHash '!_tmp!' -Algorithm SHA256).Hash) { '1' } else { '0' }"`) do set "_same=%%H"
if "!_same!"=="1" (
  echo   [---] !_rel!
  set /a SKIPPED+=1
  del "!_tmp!" 2>nul
  goto :eof
)
copy /y "!_tmp!" "!_dst!" >nul 2>&1
del "!_tmp!" 2>nul
echo   [UPD] !_rel!
set /a UPDATED+=1
goto :eof

rem -------------------------------------------------------------
:smart_sync_themes_css
rem If missing, download fresh
if not exist "!EXT_DIR!\themes.css" (
  call :download_file "ext/themes.css" "!EXT_DIR!\themes.css"
  echo   [NEW] themes.css
  set /a CREATED+=1
  goto :eof
)
rem If the file exists but is too small to be valid, re-download it
for %%S in ("!EXT_DIR!\themes.css") do set "_tcss_size=%%~zS"
if !_tcss_size! LSS 100 (
  call :download_file "ext/themes.css" "!EXT_DIR!\themes.css"
  echo   [UPD] themes.css (was corrupt/incomplete)
  set /a UPDATED+=1
  goto :eof
)
rem File exists and looks intact -- preserve it (may contain installed theme packs)
echo   [---] ext/themes.css (preserved)
set /a SKIPPED+=1
goto :eof

rem -------------------------------------------------------------
:smart_sync_self
set "_self=%~f0"
set "_selfurl=%RAW%/pandora.bat"
set "_tmp=%TEMP%\pandora_self_%RANDOM%.bat"
powershell -NoProfile -NonInteractive -Command "try { Invoke-WebRequest -Uri '%_selfurl%' -OutFile '%_tmp%' -UseBasicParsing } catch { exit 1 }" 2>nul
if not exist "!_tmp!" (
  echo   [---] pandora.bat (self-update skipped)
  goto :eof
)
for /f "usebackq delims=" %%H in (`powershell -NoProfile -NonInteractive -Command "if ((Get-FileHash '!_self!' -Algorithm SHA256).Hash -eq (Get-FileHash '!_tmp!' -Algorithm SHA256).Hash) { '1' } else { '0' }"`) do set "_same=%%H"
if "!_same!"=="1" (
  echo   [---] pandora.bat
  set /a SKIPPED+=1
  del "!_tmp!" 2>nul
  goto :eof
)
powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 800; Copy-Item '!_tmp!' '!_self!' -Force; Remove-Item '!_tmp!' -Force" &
echo   [UPD] pandora.bat (applied on exit)
set /a UPDATED+=1
goto :eof
