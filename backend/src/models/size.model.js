// src/models/size.model.js
import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Các trường khác như code, order, v.v. (tùy chọn)
}, { timestamps: true });

const Size = mongoose.model('Size', SizeSchema);
export default Size;    