import * as express from "express";
import * as bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import userRouter from "./router/userRouter";

AppDataSource.initialize()
  .then(async () => {
    const app = express();
    app.use(bodyParser.json());
    app.use("/api", userRouter);
    app.get("/", (req, res) => {
      res.send("Hello World!");
    });
    app.listen(3000);

    console.log("Express server has started on port 3000.");
  })
  .catch((error) => console.log(error));
