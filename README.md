# Awesome Project Build with TypeORM

Steps to run this project:

## Deploy backend len Render

Project backend nam trong thu muc `EnglishAppTS`.

### 1. Tao Web Service tren Render

1. Vao Render Dashboard -> New -> Web Service.
2. Chon repository cua project.
3. Cau hinh:
   - Root Directory: `EnglishAppTS`
   - Runtime: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Node Version: `20`
4. Deploy.

Render se tu gan bien `PORT`, khong can tu set `PORT`.

### 2. Environment variables tren Render

Vao Web Service -> Environment -> Add Environment Variable. Khong commit file `.env.production` co secret len git.

```env
NODE_ENV=production
NODE_VERSION=20

CLIENT_ORIGIN=https://appdatnn.vercel.app
CLIENT_URL=https://appdatnn.vercel.app
FRONTEND_URL=https://appdatnn.vercel.app
COOKIE_SAME_SITE=none

JWT_SECRET=<tao-secret-moi-that-dai>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

DATABASE_URL=<render-postgres-external-or-internal-url>
POSTGRES_SSL=true
POSTGRES_SYNC=true

CLOUDINARY_URL=<cloudinary-url>

GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=465
GMAIL_USERNAME=<gmail-address>
GMAIL_PASSWORD=<gmail-app-password>

GOOGLE_TRANSLATE_API_KEY=<google-translate-api-key>

AI_HINTS_ENABLED=true
AI_HINT_API_URL=https://text.pollinations.ai
AI_HINT_TIMEOUT_MS=14000
```

Neu da co `DATABASE_URL` thi khong bat buoc nhap cac bien `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_DB`. Code trong `src/data-source.ts` uu tien `DATABASE_URL`, sau do moi dung bo `POSTGRES_*`.

Luu y bao mat: neu ban da gui password/API key vao chat hoac commit len git, hay rotate lai cac key do tren Render, Gmail, Cloudinary, Google Cloud va Postgres.

### 3. Doi database

Co 2 cach:

1. Dung `DATABASE_URL`:
   - Tao database moi tren Render Postgres.
   - Copy `External Database URL` hoac `Internal Database URL`.
   - Sua bien `DATABASE_URL` cua Web Service sang URL moi.
   - Neu dung Render Web Service cung region/network voi Render Postgres, nen dung Internal URL.

2. Dung tung bien `POSTGRES_*`:
   - Xoa `DATABASE_URL` neu muon code dung tung bien rieng.
   - Set:

```env
POSTGRES_HOST=<host-moi>
POSTGRES_PORT=5432
POSTGRES_USERNAME=<username-moi>
POSTGRES_PASSWORD=<password-moi>
POSTGRES_DB=<database-name-moi>
POSTGRES_SSL=true
```

Sau khi doi database, redeploy Web Service.

### 4. Tao bang database

Tam thoi project dang ho tro `POSTGRES_SYNC=true`, TypeORM se tu dong sync entity sang database khi app start. Cach nay nhanh cho demo/do an, nhung production that nen chuyen sang migration:

```bash
npm run build
npx typeorm migration:run -d build/data-source.js
```

Neu dung migration thi set:

```env
POSTGRES_SYNC=false
```

### 5. Test sau khi deploy

Kiem tra backend:

```bash
curl https://<render-backend-url>
```

Kiem tra API tu frontend Vercel:

1. Dam bao frontend dang tro ve backend Render dung URL.
2. Dam bao Render backend co:
   - `CLIENT_ORIGIN=https://appdatnn.vercel.app`
   - `COOKIE_SAME_SITE=none`
   - `NODE_ENV=production`
3. Neu login bi loi cookie/CORS, restart Render service sau khi sua env.

## Vocabulary enrichment

The admin vocabulary lookup uses these optional providers:

```env
GOOGLE_TRANSLATE_API_KEY=

AZURE_TRANSLATOR_KEY=
AZURE_TRANSLATOR_REGION=
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com

# Choose one text-to-speech provider. Google is tried first when both are set.
GOOGLE_TTS_API_KEY=
GOOGLE_TTS_EN_US_VOICE=
GOOGLE_TTS_EN_GB_VOICE=

AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
AZURE_SPEECH_EN_US_VOICE=en-US-JennyNeural
AZURE_SPEECH_EN_GB_VOICE=en-GB-SoniaNeural
```

Lookup always uses the free Dictionary API for English definition, phonetic, part of speech, examples, and dictionary audio. The Vietnamese meaning is translated from the entered English word, while the Vietnamese example is translated from the dictionary example. Translation uses Google Translate when `GOOGLE_TRANSLATE_API_KEY` is configured, then falls back to Azure Translator or the public translation fallback. If TTS is not configured, lookup falls back to dictionary audio when available.



<!-- // Quy trình làm việc chuẩn với Migration
// 1. Tạo entity
//cần chạy lệnh này để tạo migration (up and down)
// 2. Tạo migration : npx typeorm-ts-node-commonjs migration:generate ./src/migration/InitDB -d src/data-source.ts 
// chạy lệnh dưới này để tạo bảng trong postgresql
// 3. Chạy migration: npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts -->
