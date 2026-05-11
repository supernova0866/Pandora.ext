@echo off
setlocal EnableDelayedExpansion
title Pandora

:: ══════════════════════════════════════════════════════════════
::  Pandora — Extension CLI
::  Usage:
::    pandora.bat install
::    pandora.bat update check
::    pandora.bat update install
::    pandora.bat help
:: ══════════════════════════════════════════════════════════════

set "GITHUB_USER=supernova0866"
set "GITHUB_REPO=Pandora.ext"
set "GITHUB_BRANCH=main"
set "RAW=https://raw.githubusercontent.com/%GITHUB_USER%/%GITHUB_REPO%/%GITHUB_BRANCH%"

set "CMD1=%~1"
set "CMD2=%~2"

if /i "!CMD1!"==""          goto :help
if /i "!CMD1!"=="help"      goto :help
if /i "!CMD1!"=="install"   goto :install
if /i "!CMD1!"=="update"    (
  if /i "!CMD2!"=="check"   goto :update_check
  if /i "!CMD2!"=="install" goto :update_install
  goto :bad_args
)
goto :bad_args

:: ════════════════════════════════════════════════════════════
:help
cls
echo.
echo   ██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ██████╗  █████╗
echo   ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗
echo   ██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██████╔╝███████║
echo   ██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██║   ██║██╔══██╗██╔══██║
echo   ██║     ██║  ██║██║ ╚████║██████╔╝╚██████╔╝██║  ██║██║  ██║
echo   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo   Pandora Extension Manager
echo   ─────────────────────────────────────────────────────────────
echo.
echo   COMMANDS:
echo.
echo     pandora.bat install          Download and set up the extension
echo     pandora.bat update check     Check if a newer version is available
echo     pandora.bat update install   Download and apply latest updates
echo     pandora.bat help             Show this help screen
echo.
echo   FIRST TIME?
echo     Run:  pandora.bat install
echo     Then load the extension folder in chrome://extensions
echo.
exit /b 0

:: ════════════════════════════════════════════════════════════
:install
cls
call :print_header
echo   [ INSTALL ]
echo   ─────────────────────────────────────────────────────────────
echo.

call :require_powershell

:: Ask where to install
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

if not exist "!EXT_DIR!\icons" mkdir "!EXT_DIR!\icons"

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

:: Save install path for future commands
echo !EXT_DIR!> "!INSTALL_DIR!\pandora_path.txt"

if !_f! gtr 0 (
  echo.
  echo   [!] !_f! file(s) failed to download. Check your connection.
  pause & exit /b 1
)

echo.
echo   ─────────────────────────────────────────────────────────────
echo   [OK] Pandora installed — !_c! files downloaded
echo   ─────────────────────────────────────────────────────────────
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
echo   To update later:  pandora.bat update install
echo.
set /p "_open=Open the extension folder now? (Y/N): "
if /i "!_open!"=="Y" explorer "!EXT_DIR!"
echo.
exit /b 0

:: ════════════════════════════════════════════════════════════
:update_check
cls
call :print_header
echo   [ UPDATE CHECK ]
echo   ─────────────────────────────────────────────────────────────
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
  echo   Run:  pandora.bat update install
  if defined CHANGELOG echo.
  if defined CHANGELOG echo   What's new: !CHANGELOG!
)
echo.
exit /b 0

:: ════════════════════════════════════════════════════════════
:update_install
cls
call :print_header
echo   [ UPDATE INSTALL ]
echo   ─────────────────────────────────────────────────────────────
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
echo   ─────────────────────────────────────────────────────────────────────────

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
echo   ─────────────────────────────────────────────────────────────
echo   !CREATED! new   !UPDATED! updated   !SKIPPED! unchanged   !FAILED! failed
echo   ─────────────────────────────────────────────────────────────
echo.

if !UPDATED! gtr 0 (
  echo   Reload Pandora in Chrome to apply changes:
  echo    1. Go to chrome://extensions
  echo    2. Click the reload button on Pandora
  echo.
  set /p "_chrome=Open chrome://extensions now? (Y/N): "
  if /i "!_chrome!"=="Y" start chrome "chrome://extensions"
) else if !CREATED! gtr 0 (
  echo   New files added — reload the extension in Chrome.
) else (
  echo   Everything is already up to date.
)
echo.
exit /b 0

:: ════════════════════════════════════════════════════════════
:bad_args
echo.
echo   Unknown command: %*
echo   Run  pandora.bat help  to see available commands.
echo.
exit /b 1

:: ════════════════════════════════════════════════════════════
::  SHARED SUBROUTINES
:: ════════════════════════════════════════════════════════════

:print_header
echo.
echo   PANDORA  ^|  Extension Manager
echo.
goto :eof

:: ─────────────────────────────────────────────────────────────
:require_powershell
where powershell >nul 2>&1
if %errorlevel% neq 0 (
  echo   [ERROR] PowerShell is required but was not found.
  pause & exit /b 1
)
goto :eof

:: ─────────────────────────────────────────────────────────────
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
echo   Could not find installation. Run:  pandora.bat install
echo.
pause & exit /b 1
:lp_done
if not exist "!EXT_DIR!\manifest.json" (
  echo   [ERROR] manifest.json not found in: !EXT_DIR!
  echo   Run:  pandora.bat install
  pause & exit /b 1
)
goto :eof

:: ─────────────────────────────────────────────────────────────
:get_local_version
set "LOCAL_VER=unknown"
if not exist "%~1" goto :eof
for /f "tokens=2 delims=:, " %%v in ('findstr /i "\"version\"" "%~1"') do (
  set "LOCAL_VER=%%~v" & goto :eof
)
goto :eof

:: ─────────────────────────────────────────────────────────────
:get_remote_version
set "REMOTE_VER=unknown"
set "CHANGELOG="
set "_tv=%TEMP%\pandora_ver_%RANDOM%.json"
:: Write a ps1 to avoid quote/space issues
set "_ps=%TEMP%\pandora_dl_%RANDOM%.ps1"
echo (New-Object System.Net.WebClient).DownloadFile('!RAW!/ext/version.json', '!_tv!') > "!_ps!"
powershell -NoProfile -NonInteractive -File "!_ps!" 2>nul
del "!_ps!" 2>nul
if not exist "!_tv!" (
  echo   [ERROR] Cannot reach GitHub. Check your connection.
  pause & exit /b 1
)
for /f "tokens=2 delims=:, " %%v in ('findstr /i "\"version\"" "!_tv!"') do set "REMOTE_VER=%%~v"
for /f "tokens=2 delims=:" %%c in ('findstr /i "changelog" "!_tv!"') do set "CHANGELOG=%%~c"
del "!_tv!" 2>nul
goto :eof

:: ─────────────────────────────────────────────────────────────
:: Simple download — writes a temp ps1 to handle spaces in paths
:download_file
set "_src=%~1"
set "_dst=%~2"
set "_ps=%TEMP%\pandora_dl_%RANDOM%.ps1"
echo   Downloading %~1...
echo (New-Object System.Net.WebClient).DownloadFile('!RAW!/!_src!', '!_dst!') > "!_ps!"
powershell -NoProfile -NonInteractive -File "!_ps!" 2>nul
del "!_ps!" 2>nul
if not exist "!_dst!" (
  echo   [ERR] %~1
  set /a _f+=1
) else (
  echo   OK
  set /a _c+=1
)
goto :eof

:: ─────────────────────────────────────────────────────────────
:: Smart sync — SHA256 compare, only overwrite if changed
:smart_sync
set "_rel=%~1"
set "_dst=%~2"
set "_tmp=%TEMP%\pandora_sync_%RANDOM%_%RANDOM%"

:: Download to temp
set "_ps=%TEMP%\pandora_dl_%RANDOM%.ps1"
echo (New-Object System.Net.WebClient).DownloadFile('!RAW!/!_rel!', '!_tmp!') > "!_ps!"
powershell -NoProfile -NonInteractive -File "!_ps!" 2>nul
del "!_ps!" 2>nul

if not exist "!_tmp!" (
  echo   [ERR] !_rel!
  set /a FAILED+=1
  goto :eof
)

:: File doesn't exist locally — just place it
if not exist "!_dst!" (
  move /y "!_tmp!" "!_dst!" >nul 2>&1
  echo   [NEW] !_rel!
  set /a CREATED+=1
  goto :eof
)

:: Compare hashes via temp ps1 file — avoids all quoting and space issues
set "_ps=%TEMP%\pandora_hash_%RANDOM%.ps1"
(
  echo $a = (Get-FileHash '!_dst!' -Algorithm SHA256^).Hash
  echo $b = (Get-FileHash '!_tmp!' -Algorithm SHA256^).Hash
  echo if ($a -eq $b^) { '1' } else { '0' }
) > "!_ps!"
for /f "usebackq delims=" %%H in (`powershell -NoProfile -NonInteractive -File "!_ps!"`) do set "_same=%%H"
del "!_ps!" 2>nul

if "!_same!"=="1" (
  echo   [---] !_rel!
  set /a SKIPPED+=1
  del "!_tmp!" 2>nul
  goto :eof
)

:: Hashes differ — overwrite
copy /y "!_tmp!" "!_dst!" >nul 2>&1
del "!_tmp!" 2>nul
echo   [UPD] !_rel!
set /a UPDATED+=1
goto :eof

:: ─────────────────────────────────────────────────────────────
:: themes.css — only create if missing, never overwrite (preserves installed packs)
:smart_sync_themes_css
if not exist "!EXT_DIR!\themes.css" (
  call :download_file "ext/themes.css" "!EXT_DIR!\themes.css"
  echo   [NEW] themes.css
  set /a CREATED+=1
) else (
  echo   [---] ext/themes.css (preserved)
  set /a SKIPPED+=1
)
goto :eof

:: ─────────────────────────────────────────────────────────────
:: Self-update — schedule replace after bat exits (can't overwrite running bat)
:smart_sync_self
set "_self=%~f0"
set "_tmp=%TEMP%\pandora_self_%RANDOM%.bat"

set "_ps=%TEMP%\pandora_dl_%RANDOM%.ps1"
echo (New-Object System.Net.WebClient).DownloadFile('!RAW!/pandora.bat', '!_tmp!') > "!_ps!"
powershell -NoProfile -NonInteractive -File "!_ps!" 2>nul
del "!_ps!" 2>nul

if not exist "!_tmp!" (
  echo   [---] pandora.bat (self-update skipped)
  goto :eof
)

:: Hash compare
set "_ps=%TEMP%\pandora_hash_%RANDOM%.ps1"
(
  echo $a = (Get-FileHash '!_self!' -Algorithm SHA256^).Hash
  echo $b = (Get-FileHash '!_tmp!' -Algorithm SHA256^).Hash
  echo if ($a -eq $b^) { '1' } else { '0' }
) > "!_ps!"
for /f "usebackq delims=" %%H in (`powershell -NoProfile -NonInteractive -File "!_ps!"`) do set "_same=%%H"
del "!_ps!" 2>nul

if "!_same!"=="1" (
  echo   [---] pandora.bat
  set /a SKIPPED+=1
  del "!_tmp!" 2>nul
  goto :eof
)

:: Schedule replace after this script exits
set "_replace=%TEMP%\pandora_replace_%RANDOM%.ps1"
(
  echo Start-Sleep -Milliseconds 800
  echo Copy-Item '!_tmp!' '!_self!' -Force
  echo Remove-Item '!_tmp!' -Force
) > "!_replace!"
powershell -NoProfile -NonInteractive -WindowStyle Hidden -File "!_replace!" &
del "!_replace!" 2>nul

echo   [UPD] pandora.bat (applied on exit)
set /a UPDATED+=1
goto :eof
