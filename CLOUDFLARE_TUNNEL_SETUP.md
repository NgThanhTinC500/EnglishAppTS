# Chay AI .gguf voi Render

## Cach nhanh nhat de test

Mo 2 file nay:

1. `run-1-ai-server.bat`
2. `run-2-cloudflare-quick-tunnel.bat`

File thu 2 se in ra link dang:

```txt
https://xxxx.trycloudflare.com
```

Render env:

```env
AI_PROVIDER=local
AI_FINE_TUNED_API_URL=https://xxxx.trycloudflare.com/v1/chat/completions
AI_FINE_TUNED_MODEL=Qwen2.5-7B-Instruct.Q4_K_M
AI_HINT_TIMEOUT_MS=60000
```

Quick tunnel doi URL moi lan chay.

## Muon URL co dinh

Can co domain rieng da add vao Cloudflare.

Vi du domain la:

```txt
yourdomain.com
```

Muon AI URL la:

```txt
https://ai.yourdomain.com/v1/chat/completions
```

### Buoc 1: Login Cloudflare

Chay CMD:

```bat
D:\DOWLOAD\cloudflared.exe tunnel login
```

Trinh duyet se mo ra. Dang nhap Cloudflare va chon domain.

### Buoc 2: Tao tunnel co dinh

```bat
D:\DOWLOAD\cloudflared.exe tunnel create english-ai
```

### Buoc 3: Map DNS

Thay `yourdomain.com` bang domain that cua ban:

```bat
D:\DOWLOAD\cloudflared.exe tunnel route dns english-ai ai.yourdomain.com
```

### Buoc 4: Tao file config

Mo thu muc:

```txt
C:\Users\thanh\.cloudflared
```

Tim file `.json` vua duoc tao. Ten file thuong la tunnel id, vi du:

```txt
11111111-2222-3333-4444-555555555555.json
```

Tao file:

```txt
C:\Users\thanh\.cloudflared\config.yml
```

Noi dung:

```yml
tunnel: english-ai
credentials-file: C:\Users\thanh\.cloudflared\PASTE_TUNNEL_ID_FILE.json

ingress:
  - hostname: ai.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

Sua 2 cho:

- `PASTE_TUNNEL_ID_FILE.json`
- `ai.yourdomain.com`

### Buoc 5: Chay tunnel co dinh

Mo:

```txt
run-2-cloudflare-fixed-tunnel.bat
```

Render env:

```env
AI_PROVIDER=local
AI_FINE_TUNED_API_URL=https://ai.yourdomain.com/v1/chat/completions
AI_FINE_TUNED_MODEL=Qwen2.5-7B-Instruct.Q4_K_M
AI_HINT_TIMEOUT_MS=60000
```

## Moi lan su dung

Mo:

1. `run-1-ai-server.bat`
2. `run-2-cloudflare-fixed-tunnel.bat`

Neu dung quick tunnel thi mo:

1. `run-1-ai-server.bat`
2. `run-2-cloudflare-quick-tunnel.bat`

Sau do update Render env bang link quick tunnel moi.
