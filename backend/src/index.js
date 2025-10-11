import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//connect voi mongodb
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Ket noi thanh cong MongoDb"))
  .catch((err) => console.error("Ket noi that bai voi MongoDb", err));

//Route test
app.get("/", (req, res) => {
  res.send("Backend da duoc ket noi voi MongoDb");
});

//lang nghe cong
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server dang chay tren Port: ${PORT}`);
});
