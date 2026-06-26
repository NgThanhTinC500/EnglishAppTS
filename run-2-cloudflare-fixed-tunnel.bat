@echo off
title TT English - Cloudflare Fixed Tunnel
echo Starting fixed Cloudflare tunnel named english-ai
echo This works after you run the setup steps in CLOUDFLARE_TUNNEL_SETUP.md
D:\DOWLOAD\cloudflared.exe tunnel run english-ai
pause
