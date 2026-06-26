@echo off
title TT English - Test Local AI
echo Testing llama-server at http://localhost:8080
curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"system\",\"content\":\"You are an English teacher. Reply in Vietnamese.\"},{\"role\":\"user\",\"content\":\"Fix grammar: I has a book\"}],\"temperature\":0.3,\"max_tokens\":200}"
echo.
pause
