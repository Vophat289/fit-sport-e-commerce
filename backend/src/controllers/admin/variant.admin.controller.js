// src/controllers/admin/variant.admin.controller.js
import ProductsVariant from "../../models/productsVariant.model.js";
import Size from "../../models/size.model.js";
import Color from "../../models/color.model.js";
import Product from "../../models/product.model.js";

//Thực hiện Populate (cho ProductsVariant)
const populateVariant = (query) => {
  return query
    .populate("size_id", "name")
    .populate("color_id", "name hex_code")
    .exec();
};

// 1. Lấy tất cả biến thể theo Product ID
export const getVariantsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await populateVariant(
      ProductsVariant.find({ product_id: productId })
    );
    res.status(200).json(variants);
  } catch (error) {
    console.error("Lỗi khi tải biến thể:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tải biến thể" });
  }
};

// 2. Thêm biến thể mới
export const addVariant = async (req, res) => {
  try {
    const existingVariant = await ProductsVariant.findOne({
      product_id: req.body.product_id,
      size_id: req.body.size_id,
      color_id: req.body.color_id,
    });
    if (existingVariant) {
      return res.status(400).json({
        message: "Biến thể (Size/Color) này đã tồn tại cho sản phẩm này.",
      });
    }
    const newVariant = new ProductsVariant(req.body);
    await newVariant.save();

    const savedVariant = await populateVariant(
      ProductsVariant.findById(newVariant._id)
    );
    res.status(201).json(savedVariant);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Biến thể (Size/Color) này đã tồn tại cho sản phẩm này.",
      });
    }
    res
      .status(500)
      .json({ message: "Lỗi khi thêm biến thể", error: error.message });
  }
};

// 3. Cập nhật biến thể
export const updateVariant = async (req, res) => {
  try {
    const updatedVariant = await ProductsVariant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVariant) {
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }

    const finalVariant = await populateVariant(
      ProductsVariant.findById(updatedVariant._id)
    );

    res.status(200).json(finalVariant);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Biến thể (Size/Color) này đã tồn tại cho sản phẩm này.",
      });
    }
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật biến thể", error: error.message });
  }
};

// 4. Xóa biến thể
export const deleteVariant = async (req, res) => {
  try {
    const deletedVariant = await ProductsVariant.findByIdAndDelete(
      req.params.id
    );
    if (!deletedVariant) {
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }
    res.status(200).json({ message: "Xóa biến thể thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa biến thể", error });
  }
};

// Hàm chung để lấy tất cả các tài liệu từ một Model cụ thể
const getAllOptions = (Model) => async (req, res) => {
  try {
    const options = await Model.find();
    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({
      message: `Lỗi khi tải danh sách ${Model.modelName}`,
      error: error.message,
    });
  }
};

export const getSizes = getAllOptions(Size);
export const getColors = getAllOptions(Color);

export const addSize = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Tên size là bắt buộc" });

    // Kiểm tra trùng
    const exists = await Size.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Size đã tồn tại" });

    const newSize = new Size({ name });
    await newSize.save();

    res.status(201).json({ message: "Thêm size thành công", size: newSize });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm size", error: error.message });
  }
};
export const addColor = async (req, res) => {
  try {
    const { name, hex_code } = req.body;

    if (!name) return res.status(400).json({ message: "Tên màu là bắt buộc" });

    const exists = await Color.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Màu đã tồn tại" });

    const newColor = new Color({ name, hex_code });
    await newColor.save();

    res.status(201).json({ message: "Thêm màu thành công", color: newColor });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm màu", error: error.message });
  }
};

// 5. Lấy chi tiết sản phẩm
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy sản phẩm kèm category
    const product = await Product.findById(id)
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm !" });
    }

    // Lấy variants theo product_id
    const variants = await ProductsVariant.find({ product_id: product._id })
      .populate("size_id")
      .populate("color_id")
      .lean();

    // Danh sách size có trong variants
    const availableSizes = [];
    const sizeSet = new Set();

    variants.forEach((v) => {
      if (v.size_id && !sizeSet.has(v.size_id._id.toString())) {
        sizeSet.add(v.size_id._id.toString());
        availableSizes.push({
          id: v.size_id._id,
          name: v.size_id.name,
        });
      }
    });

    // Danh sách color có trong variants
    const availableColors = [];
    const colorSet = new Set();

    variants.forEach((v) => {
      if (v.color_id && !colorSet.has(v.color_id._id.toString())) {
        colorSet.add(v.color_id._id.toString());
        availableColors.push({
          id: v.color_id._id,
          name: v.color_id.name,
          hex_code: v.color_id.hex_code || null,
        });
      }
    });

    return res.json({
      success: true,
      ...product,
      variants,
      availableSizes,
      availableColors,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};
export const getAvailableVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await populateVariant(
      ProductsVariant.find({ product_id: productId })
    );
    const availableSizes = [];
    const sizeSet = new Set();
    const availableColors = [];
    const colorSet = new Set();

    variants.forEach((v) => {
      if (v.size_id && !sizeSet.has(v.size_id._id.toString())) {
        sizeSet.add(v.size_id._id.toString());
        availableSizes.push({ id: v.size_id._id, name: v.size_id.name });
      }
      if (v.color_id && !colorSet.has(v.color_id._id.toString())) {
        colorSet.add(v.color_id._id.toString());
        availableColors.push({
          id: v.color_id._id,
          name: v.color_id.name,
          hex: v.color_id.hex_code || null,
        });
      }
    });

    res.status(200).json({ availableSizes, availableColors, variants });
  } catch (error) {
    console.error("Lỗi khi tải biến thể:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tải biến thể" });
  }
};

// 2. Lấy chi tiết biến thể theo size/color
export const getVariantDetails = async (req, res) => {
  try {
    const { product, size, color } = req.query;

    const variant = await ProductsVariant.findOne({
      product_id: product,
      size_id: size,
      color_id: color,
    })
      .populate("size_id")
      .populate("color_id")
      .exec();

    if (!variant) return res.json({ price: 0, quantity: 0 });

    res.json({ price: variant.price, quantity: variant.quantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
