import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
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
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    image: {
        type: [String],
        default: []
    },
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
