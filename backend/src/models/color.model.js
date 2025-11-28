// src/models/color.model.js
import mongoose from 'mongoose';

const ColorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    hex_code: { // Mã HEX để hiển thị màu trên Frontend (ví dụ: #FF0000)
        type: String,
        required: false, 
    }
}, { timestamps: true });

const Color = mongoose.model('Color', ColorSchema);
export default Color;