import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
<<<<<<< HEAD
    slug:{
=======
    slug: {
>>>>>>> 918f4c1 (updatecode thanhdanh)
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
<<<<<<< HEAD
    description:{
        type: String,
        required: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId, ref: "Category",  
=======
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
>>>>>>> 918f4c1 (updatecode thanhdanh)
        ref: "Category",
        required: true,
    },
    image: {
        type: [String],
        default: []
    },
<<<<<<< HEAD
    colors:[String],   
    sizes:[String],
}, {timestamps: true});

//tạo index cho slug để tìm kiếm nhanh hơn
productSchema.index({slug: 1}); //1 là tăng dần

const Product = mongoose.model("Product", productSchema);

export default Product;
=======
    colors: [String],
    sizes: [String],

    // ⭐⭐⭐ Thêm sản phẩm nổi bật
    isFeatured: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

productSchema.index({ slug: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
>>>>>>> 918f4c1 (updatecode thanhdanh)
