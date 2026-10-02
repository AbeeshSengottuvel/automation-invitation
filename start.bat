@echo off
title Automation Arena - Local Server
echo ======================================================
echo   Starting Automation Arena Local Server...
echo ======================================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting with Node.js...
    node serve.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Node.js not detected. Starting with Python server...
    start http://localhost:8080/index.html
    python -m http.server 8080
    goto end
)

echo Starting directly in default web browser...
start index.html

:end
pause
