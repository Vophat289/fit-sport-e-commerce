import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, //bắt buộc
        unique: true,   //k trùng tên
        trim: true  //auto loại bỏ khoảng trắng đầu hoặc cuối
    },
    slug:{
        type: String,
        required: true, //tạo url
        unique: true
    },
    description: {
        type: String,
        default: "" 
    },
    image: {
        type: String,
    }
},{timestamps: true});

export default mongoose.model("Category", categorySchema);