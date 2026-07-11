import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import config from "./config";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.routes";
import { globalErrorHandler } from "./middlewares/globalErrorHandlar";
import { notFound } from "./middlewares/notFound";
import { categoryRoutes } from "./modules/category/category.routes";
import { propertiesRoutes } from "./modules/properties/properties.routes";
const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/properties", propertiesRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});
app.use(notFound);
app.use(globalErrorHandler);

export default app;
