import * as dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || "development";

dotenv.config({
  path: `.env.${nodeEnv}`,
});
dotenv.config();
