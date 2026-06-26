@echo off
title TT English - Test Render Chat
set /p RENDER_URL=Paste Render backend URL, for example https://your-api.onrender.com :
curl %RENDER_URL%/api/v1/chat -H "Content-Type: application/json" -d "{\"message\":\"Fix grammar: I has a book\",\"history\":[]}"
echo.
pause
