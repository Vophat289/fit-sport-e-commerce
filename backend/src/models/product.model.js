import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId, ref: "Category",  
        ref: "Category",
    },
    image: {
        type: [String],
        default: []
    },
    colors:[String],   
    sizes:[String],
}, {timestamps: true});

//tạo index cho slug để tìm kiếm nhanh hơn
productSchema.index({slug: 1}); //1 là tăng dần

const Product = mongoose.model("Product", productSchema);

export default Product;