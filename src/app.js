import userRouter from "./routes/user.route.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/users", userRouter);

export { app };
