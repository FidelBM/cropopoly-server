import express from 'express'
import userRoutes from './routes/users.routes.js'
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(userRoutes)

export default app 