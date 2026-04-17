@echo off
TITLE MarketVibe Auto-Pilot Control
color 0B

echo =========================================
echo 🤖 MarketVibe Auto-Pilot Launching...
echo =========================================

:: 1. Run Health Check
echo 🏥 Running System Health Check...
node health_check.mjs
if %errorlevel% neq 0 (
    echo.
    echo ❌ HEALTH CHECK FAILED. Please fix the errors above before launching.
    pause
    exit /b %errorlevel%
)

echo.
echo 🚀 Launching Autonomous Scheduler...
echo 📅 Cycle: Every 4 hours (Growth Nexus)
echo 🔍 Sentinel: Active
echo 🕵️ Shadow Agent: Active
echo 📧 Nurturer: Active
echo 📣 Herald: Active
echo.

node revenue_engine.mjs

pause
