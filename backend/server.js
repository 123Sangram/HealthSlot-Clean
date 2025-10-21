import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";

// app config
const app = express();
const port = process.env.PORT || 3001;
connectDB();
connectCloudinary();



app.use(express.json());

app.use(cors({
  origin: 'https://healthslot-clean-frontend.onrender.com', 
  credentials: true, 
}));

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("SANGRAM API WORKING");
});

app.listen(port, () => {
  console.log(`Server started at: http://localhost:${port}`);
});








