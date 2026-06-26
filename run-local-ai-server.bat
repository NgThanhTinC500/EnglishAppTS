@echo off
cd /d D:\DOWLOAD\llama-b9820-bin-win-cpu-x64
llama-server.exe -m model\Qwen2.5-7B-Instruct.Q4_K_M.gguf --host 0.0.0.0 --port 8080 -c 4096
pause
