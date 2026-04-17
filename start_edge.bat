@echo off
:: MarketVibe Edge Launcher (Isolated Profile)
:: Starts Edge with remote debugging and a dedicated bot profile
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --headless=new --window-size=1920,1080 --user-data-dir="c:\Users\qwerty\Desktop\prototype\.social_profile" --no-first-run --no-default-browser-check
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9223 --headless=new --window-size=1920,1080 --user-data-dir="c:\Users\qwerty\Desktop\prototype\.bot_profile" --no-first-run --no-default-browser-check
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9228 --headless=new --window-size=1920,1080 --user-data-dir="c:\MarketVibe\Profiles\FacebookBot" --no-first-run --no-default-browser-check
