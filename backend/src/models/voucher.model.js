import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    value: { type: Number, required: true },  
    type: { type: String, enum: ["percent", "fixed"], required: true },
    min_order_value: { type: Number, default: 0 },

    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    usage_limit: { type: Number, default: 0 }, 
    used_count: { type: Number, default: 0 },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export default mongoose.model("Voucher", voucherSchema);
