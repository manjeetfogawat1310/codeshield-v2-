@echo off
setlocal
cd /d "%~dp0"

set "PORT=8000"
where py >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:%PORT%/index.html
    py -m http.server %PORT%
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:%PORT%/index.html
    python -m http.server %PORT%
    goto :end
)

echo Python was not found.
echo Open this folder in VS Code and use the Live Server extension on index.html.
pause

:end
endlocal
