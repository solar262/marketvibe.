@echo off
title MarketVibe Sales Navigator Companion
echo Opening Edge setup, Sales Navigator, and MarketVibe import...
echo.
echo If the extension is not installed yet:
echo 1. Turn on Developer mode in Edge Extensions.
echo 2. Click Load unpacked.
echo 3. Select C:\marketvibe-pro\browser-extension\sales-navigator-companion
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process msedge.exe 'edge://extensions/'; Start-Process msedge.exe 'https://www.linkedin.com/sales/search/people'; Start-Process msedge.exe 'https://www.marketvibe1.com/admin/import'"
