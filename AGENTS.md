# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript Express backend using TypeORM and PostgreSQL. Source lives under `src/`; compiled JavaScript is emitted to `build/` and should not be edited directly. Main entry points are `src/index.ts` for the server and `src/data-source.ts` for TypeORM configuration.

Key modules follow a backend layout: `controller/` handles HTTP requests, `service/` contains business logic, `router/` wires routes, `entity/` defines TypeORM models, `migration/` stores database migrations, `schemas/` contains validation schemas, `middlewares/` contains Express middleware, `socket/` contains Socket.IO handlers, and `utils/` contains shared helpers. Uploaded assets live in `src/public/audio` and `src/public/img`.

## Build, Test, and Development Commands

- `npm run start:dev`: run `src/index.ts` with `ts-node-dev` and automatic restarts.
- `npm run build`: remove `build/` and compile TypeScript with `tsc`.
- `npm start`: build, then run `build/index.js`.
- `npm run start:prod`: run the compiled app with `NODE_ENV=production`.
- `npm run lint`: lint files under `src/**/*.{js,ts,tsx}`.
- `npm run lint:fix`: apply automatic ESLint fixes.
- `npm run typeorm -- migration:run -d src/data-source.ts`: run pending migrations.
- `npx typeorm-ts-node-commonjs migration:generate ./src/migration/Name -d src/data-source.ts`: generate a migration.

## Coding Style & Naming Conventions

Use TypeScript with CommonJS output and ES2021 target. Keep source under `src/` so it is included by `tsconfig.json`. Entities use PascalCase filenames/classes such as `User.ts`; services and routers generally use camelCase filenames such as `authService.ts` and `authRouter.ts`. Controllers currently mix PascalCase and camelCase, so match the adjacent feature. Prefix intentionally unused variables or parameters with `_`; ESLint permits that pattern.

## Testing Guidelines

No test framework or test script is configured. When adding tests, add an `npm test` script and keep tests near the feature or in `test/` or `__tests__/`. Until then, verify with `npm run build` and `npm run lint`, and manually exercise affected API routes.

## Commit & Pull Request Guidelines

Recent history uses short, imperative summaries with occasional Conventional Commit prefixes, for example `fix(auth): fix JWT verification and password reset flow`. Prefer `type(scope): summary` for focused changes (`fix(auth): ...`, `feat(vocabulary): ...`). Pull requests should describe behavior changes, list migration or environment impacts, link issues, and include API examples or screenshots when response shapes or user-facing behavior change.

## Security & Configuration Tips

Keep secrets in `.env` and never commit credentials, tokens, database URLs, or service account keys. Review migrations before running them against shared databases, and document any required environment variables when adding integrations such as email, storage, speech, or JWT configuration.
