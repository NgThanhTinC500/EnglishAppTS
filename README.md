# Awesome Project Build with TypeORM

Steps to run this project:

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
