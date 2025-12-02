import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
// import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false, // nên tắt để dùng migrationx
  logging: true, // display query in console , ex: SELECT * FROM ...
  entities: ["src/entity/**/*.ts"], // chỉ cho TypeORM biết nơi tìm các entity
  migrations: ["src/migration/**/*.ts"], // chú ý cái này, tránh duplicate
  subscribers: ["src/subscriber/**/*.ts"],
  ssl: !!process.env.POSTGRES_SSL,
});
// Quy trình làm việc chuẩn với Migration
// 1. Tạo entity
// 2. Tạo migration : npx typeorm-ts-node-commonjs migration:generate ./src/migration/CreateUserTable -d src/data-source.ts 
// 3. Chạy migration: npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts



