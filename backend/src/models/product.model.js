import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [ true, "Tên sản phẩm là bắt buộc"],
        trim: true,
        minlength: [2, "Tên sản phẩm phải ít nhất 2 ký tự"],
    },
    slug:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    price: {
        type: Number,
        min: [0, "Giá không hợp lệ"],
    },
    description:{
        type: String,
        required: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId, ref: "Category",  
        ref: "Category",
        required: [true, "Danh mục sản phẩm là bắt buộc"],
    },
    image: {
        type: [String],
        validate: {
            validator: (arr) => arr.length > 0,
            message: "Sản phẩm phải có ít nhất 1 hình ảnh",
        },
    },

    colors: {
        type: [String],
        default: [],
    },
    sizes: {
        type: [String],
        default: [],
    },

    viewCount: {
        type: Number,
        default: 0
    }
}, {timestamps: true});

const Product = mongoose.model("Product", productSchema);

export default Product;

