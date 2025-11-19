import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema({
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "product", 
    required: true 
    },

  name: { 
    type: String 
    }, 

  price: { 
    type: Number, 
    required: true  
    },

  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
    },

  size: { 
    type: String, 
    default: null 
    },

  color: { 
    type: String, 
    default: null 
    },

  total: { 
    type: Number, 
    required: true 
    } }, 
    
    { 
    _id: false  
    });

const cartSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
    },

  products: [cartProductSchema],

  cart_total: { 
    type: Number, 
    default: 0 
    },

  // nếu có dùng voucher
  voucher: {
    code: { 
        type: String, 
        default: null 
    },

    discount: { 
        type: Number, 
        default: 0 
    } 

  },

  updated_at: { 
    type: Date, 
    default: Date.now }
});

cartSchema.pre("save", function(next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model("Cart", cartSchema);
