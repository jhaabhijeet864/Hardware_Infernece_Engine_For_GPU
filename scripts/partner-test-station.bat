@echo off
setlocal enabledelayedexpansion

echo ==============================================================
echo    Local AI Hardware Qualification Suite - Partner Test Station
echo    Shenzhen & Global OEM Factory Acceptance Runner
echo ==============================================================
echo.

echo [1/3] Probing Machine Hardware Topology...
call npx tsx src\cli\runner.ts env
if %errorlevel% neq 0 (
    echo [ERROR] Failed to query system environment. Make sure Node 20+ and drivers are installed.
    exit /b %errorlevel%
)

echo.
echo Select Test Workload Archetype:
echo   1. Enterprise RAG ^& Document QA (Llama 3.1 8B, 8 streams)
echo   2. Customer Support Chatbot (Llama 3.2 3B, 32 streams)
echo   3. Developer Code Assistant (Qwen 2.5 14B INT8, 4 streams)
echo   4. Autonomous Agentic Reasoner (Llama 3.3 70B INT4, 2 streams)
echo.
set /p choice="Enter selection [1-4, default 1]: "
if "%choice%"=="" set choice=1

set ARCHETYPE=enterprise-rag
if "%choice%"=="1" set ARCHETYPE=enterprise-rag
if "%choice%"=="2" set ARCHETYPE=customer-support
if "%choice%"=="3" set ARCHETYPE=code-assistant
if "%choice%"=="4" set ARCHETYPE=agentic-reasoner

echo.
echo [2/3] Executing Automated Benchmark Suite for '%ARCHETYPE%'...
echo Telemetry sampling running in background at 100ms intervals...
echo.

call npx tsx src\cli\runner.ts run --archetype %ARCHETYPE% --profile "OEM Partner Factory Delivery Acceptance" --out ./factory_acceptance_reports
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Benchmark exited with non-zero status. Inspect logs above.
)

echo.
echo [3/3] Factory Acceptance Run Complete!
echo Qualification artifacts written to: .\factory_acceptance_reports\
echo.
pause
