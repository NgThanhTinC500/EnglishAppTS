@echo off
title TT English - Local GGUF AI Server
cd /d D:\DOWLOAD\llama-b9820-bin-win-cpu-x64
echo Starting Qwen2.5 GGUF on http://localhost:8080
echo Keep this window open while using the chatbot.
llama-server.exe -m model\Qwen2.5-7B-Instruct.Q4_K_M.gguf --host 0.0.0.0 --port 8080 -c 4096
pause
@REM .\EnglishAppTS\run-1-ai-server.bat
@REM .\EnglishAppTS\run-2-cloudflare-quick-tunnel.bat
