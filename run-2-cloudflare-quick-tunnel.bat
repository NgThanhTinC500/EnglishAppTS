@echo off
title TT English - Cloudflare Quick Tunnel
echo Starting temporary Cloudflare tunnel to http://localhost:8080
echo Copy the https://*.trycloudflare.com URL shown below.
echo Render env must be: AI_FINE_TUNED_API_URL=https://YOUR-URL.trycloudflare.com/v1/chat/completions
D:\DOWLOAD\cloudflared.exe tunnel --url http://localhost:8080
pause
