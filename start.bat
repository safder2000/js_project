@echo off

rem Get the Process ID (PID) of the Node.js process
for /f "tokens=2" %%i in ('tasklist ^| find "node.exe"') do set "NODE_PID=%%i"

rem Check if Node.js process is running
if defined NODE_PID (
    echo Terminating Node.js process with PID %NODE_PID%...
    taskkill /F /PID %NODE_PID%
    timeout /nobreak /t 2 > nul
)

echo Closing the current terminal...
taskkill /F /IM cmd.exe

echo Waiting for 5 seconds...
timeout /nobreak /t 5 > nul

echo Opening a new terminal and running "node bungali"...
start cmd /k "cd /d %CD% && node bungali"
