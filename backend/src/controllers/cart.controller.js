import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js"; 
import Voucher from "../models/voucher.model.js"; 

function recalcCartTotals(cart) {
  let total = 0;
  cart.products.forEach(p => {
    p.total = Number((p.price * p.quantity).toFixed(0));
    total += p.total;
  });
  cart.cart_total = Number(total - (cart.voucher?.discount || 0));
  if (cart.cart_total < 0) cart.cart_total = 0;
}

const CartController = {

  // GET /api/cart/:user_id
  async getCart(req, res) {
    try {
      const { user_id } = req.params;
      let cart = await Cart.findOne({ user_id }).populate("products.product_id", "name price");
      if (!cart) {
        return res.json({ success: true, cart: { products: [], cart_total: 0, voucher: { code: null, discount: 0 } } });
      }
      // ensure totals correct
      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/add
  async addToCart(req, res) {
    try {
      const { user_id, product_id, quantity = 1, size = null, color = null } = req.body;
      if (!user_id || !product_id) return res.status(400).json({ success: false, message: "user_id and product_id required" });

      const product = await Product.findById(product_id);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

      let cart = await Cart.findOne({ user_id });
      if (!cart) {
        cart = new Cart({ user_id, products: [], cart_total: 0, voucher: { code: null, discount: 0 } });
      }

      const idx = cart.products.findIndex(p => p.product_id.toString() === product_id.toString() && p.size === size && p.color === color);

      if (idx >= 0) {
        cart.products[idx].quantity += Number(quantity);
      } else {
        cart.products.push({
          product_id,
          name: product.name || "",
          price: product.price || 0,
          quantity: Number(quantity),
          size,
          color,
          total: (product.price || 0) * Number(quantity)
        });
      }

      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, message: "Added to cart", cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/increase
  async increaseQty(req, res) {
    try {
      const { user_id, product_id, size = null, color = null } = req.body;
      let cart = await Cart.findOne({ user_id });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      const item = cart.products.find(p => p.product_id.toString() === product_id && p.size === size && p.color === color);
      if (!item) return res.status(404).json({ success: false, message: "Product not in cart" });

      item.quantity += 1;
      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/decrease
  async decreaseQty(req, res) {
    try {
      const { user_id, product_id, size = null, color = null } = req.body;
      let cart = await Cart.findOne({ user_id });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      const idx = cart.products.findIndex(p => p.product_id.toString() === product_id && p.size === size && p.color === color);
      if (idx === -1) return res.status(404).json({ success: false, message: "Product not in cart" });

      if (cart.products[idx].quantity > 1) {
        cart.products[idx].quantity -= 1;
      } else {
        cart.products.splice(idx, 1);
      }

      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/remove
  async removeItem(req, res) {
    try {
      const { user_id, product_id, size = null, color = null } = req.body;
      let cart = await Cart.findOne({ user_id });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      cart.products = cart.products.filter(p => !(p.product_id.toString() === product_id && p.size === size && p.color === color));
      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/cart/clear/:user_id
  async clearCart(req, res) {
    try {
      const { user_id } = req.params;
      await Cart.findOneAndDelete({ user_id });
      res.json({ success: true, message: "Cart cleared" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/apply-voucher
  async applyVoucher(req, res) {
    try {
      const { user_id, code } = req.body;
      if (!user_id || !code) return res.status(400).json({ success: false, message: "user_id and code required" });

      let cart = await Cart.findOne({ user_id });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      const voucher = await Voucher.findOne({ code });
      if (!voucher) return res.status(400).json({ success: false, message: "Voucher not found" });

      const now = new Date();
      if (now < voucher.start_date || now > voucher.end_date) {
        return res.status(400).json({ success: false, message: "Voucher expired or not started" });
      }
      if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
        return res.status(400).json({ success: false, message: "Voucher usage limit reached" });
      }

      let subtotal = 0;
      cart.products.forEach(p => subtotal += p.price * p.quantity);

      if (subtotal < voucher.min_order_value) {
        return res.status(400).json({ success: false, message: `Minimum order ${voucher.min_order_value}` });
      }

      let discount = 0;
      if (voucher.type === "percent") discount = Math.floor((subtotal * voucher.value) / 100);
      else discount = voucher.value;

      if (discount > subtotal) discount = subtotal;
      cart.voucher = { code: voucher.code, discount };
      recalcCartTotals(cart);
      await cart.save();

      res.json({ success: true, message: "Voucher applied", discount, cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/cart/remove-voucher
  async removeVoucher(req, res) {
    try {
      const { user_id } = req.body;
      let cart = await Cart.findOne({ user_id });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      cart.voucher = { code: null, discount: 0 };
      recalcCartTotals(cart);
      await cart.save();
      res.json({ success: true, message: "Voucher removed", cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  
};

export default CartController;
