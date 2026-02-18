@echo off
:: MarketVibe Edge Launcher
:: Starts Edge with remote debugging so the Herald bot can post autonomously
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222
