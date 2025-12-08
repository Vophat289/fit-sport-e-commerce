import mongoose from 'mongoose';

const OdersDetailsSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Oders',
        required: true,
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductsVariant',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },

   
    productName: { type: String, required: false },

   
    productImage: { type: [String], default: [] },
    
}, { timestamps: true });

const OdersDetails = mongoose.model('OdersDetails', OdersDetailsSchema);
export default OdersDetails;
