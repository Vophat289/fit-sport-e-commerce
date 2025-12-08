// src/models/productsVariant.model.js
import mongoose from 'mongoose';

const ProductsVariantSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
    color_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 }, // Số lượng tồn kho
    image_url: String,
}, { timestamps: true });

const ProductsVariant = mongoose.model('ProductsVariant', ProductsVariantSchema);
export default ProductsVariant;