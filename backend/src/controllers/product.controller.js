import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import slugify from "slugify";
import { error } from "console";
import ProductsVariant from "../models/productsVariant.model.js";

//lấy toàn bộ sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name slug");
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

//lấy sản phẩm theo slug
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug })
    .populate("category", "name")
    .lean();


    //kiểm tra sản phẩm có tồn tại k
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm !" });
    }
    const variants = await ProductsVariant.find({ product_id: product._id })
      .populate("size_id")
      .populate("color_id")
      .lean();
    const availableSizes = [];
    const sizeSet = new Set();

    variants.forEach(v => {
      if (v.size_id && !sizeSet.has(v.size_id._id.toString())) {
        sizeSet.add(v.size_id._id.toString());
        availableSizes.push({
          id: v.size_id._id,
          name: v.size_id.name
        });
      }
    });

    const availableColors = [];
    const colorSet = new Set();

    variants.forEach(v => {
      if (v.color_id && !colorSet.has(v.color_id._id.toString())) {
        colorSet.add(v.color_id._id.toString());
        availableColors.push({
          id: v.color_id._id,
          name: v.color_id.name,
          hex_code: v.color_id.hex_code || null
        });
      }
    });

    return res.json({
      ...product,
      variants,
      availableSizes,
      availableColors,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy sản phẩm: ", error: error.message });
  }
};

//lấy sản phẩm theo danh mục
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const products = await Product.find({ category: category._id }).populate(
      "category",
      "name slug"
    );
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "Không có sản phẩm trong danh mục này" });
    }

    res.json(products);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Lỗi khi lấy sản phẩm trong danh mục",
        error: error.message,
      });
  }
};

//thêm sản phẩm
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    let { colors, sizes } = req.body;

    if (!name || name.trim() === "")
      return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm" });

    if (!price)
      return res.status(400).json({ message: "Vui lòng nhập giá sản phẩm" });

    if (!category)
      return res.status(400).json({ message: "Vui lòng chọn danh mục" });

    if (!colors || (Array.isArray(colors) && colors.length === 0)) {
      return res.status(400).json({ message: "Vui lòng nhập màu sắc sản phẩm" });
    }

    if (!sizes || (Array.isArray(sizes) && sizes.length === 0)) {
      return res.status(400).json({ message: "Vui lòng nhập kích cỡ sản phẩm" });
    }

    const imageUrls = [];
    const slug = slugify(name, { lower: true, locale: "vi" });

    // Kiểm tra slug đã tồn tại chưa
    const exitingProduct = await Product.findOne({ slug });
    if (exitingProduct) {
      return res.status(400).json({ message: "Sản phẩm đã tồn tại" });
    }

    // Upload ảnh
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    } else {
      return res.status(400).json({ message: "Vui lòng tải lên ít nhất 1 hình ảnh" });
    }

    // Xử lý colors
    if (typeof colors === "string") {
      try {
        colors = JSON.parse(colors);
      } catch {
        colors = [colors];
      }
    }

    // Xử lý sizes
    if (typeof sizes === "string") {
      try {
        sizes = JSON.parse(sizes);
      } catch {
        sizes = [sizes];
      }
    }

    const newProduct = new Product({
      name,
      slug,
      price,
      description,
      category,
      colors,
      sizes,
      image: imageUrls,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({
      message: "Thêm sản phẩm thành công",
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
  }
};

//cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      category,
      colors,
      sizes,
      existingImages,
    } = req.body;

    if (!name || name.trim() === "")
      return res.status(400).json({ message: "Tên sản phẩm không được để trống" });

    if (!price)
      return res.status(400).json({ message: "Giá sản phẩm không được để trống" });

    if (!category)
      return res.status(400).json({ message: "Danh mục không được để trống" });

    // Tìm sản phẩm cũ
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    let newColors = product.colors;
    if (colors !== undefined) {
      if (typeof colors === "string") {
        try {
          newColors = JSON.parse(colors);
        } catch {
          newColors = colors.split(",").map((c) => c.trim());
        }
      } else if (Array.isArray(colors)) {
        newColors = colors;
      }
      product.colors = newColors;
    }

    let newSizes = product.sizes;
    if (sizes !== undefined) {
      if (typeof sizes === "string") {
        try {
          newSizes = JSON.parse(sizes);
        } catch {
          newSizes = sizes.split(",").map((s) => s.trim());
        }
      } else if (Array.isArray(sizes)) {
        newSizes = sizes;
      }
      product.sizes = newSizes;
    }

    if (name && name.trim() !== product.name) {
      const newSlug = slugify(name, { lower: true, locale: "vi" });

      const exitingProduct = await Product.findOne({
        slug: newSlug,
        _id: { $ne: id },
      });
      if (exitingProduct) {
        return res
          .status(400)
          .json({ message: "Tên sản phẩm này đã được sử dụng" });
      }

      product.name = name.trim();
      product.slug = newSlug;
    }

    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;

    let keptImages = [];
    if (existingImages) {
      try {
        keptImages = JSON.parse(existingImages);
      } catch {
        keptImages = [];
      }
    }

    // ảnh bị xóa
    const imagesToDelete = product.image.filter(
      (img) => !keptImages.includes(img)
    );

    product.image = keptImages;

    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        newImageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
      product.image = [...product.image, ...newImageUrls];
    }

    await product.save();
    await product.populate("category", "name");

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

//xóa sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteProduct = await Product.findByIdAndDelete(id);

    if (!deleteProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm !" });
    }
    res.status(200).json({ message: "Đã xóa sản phẩm thành công !" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm: ", error: error.message });
  }
};

//lượt xem
export const incrementViewCount = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } }, //$inc tăng giá trị lên 1
      { new: true } //trả về doc sau khi update
    );

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.json({ viewCount: product.viewCount });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tăng lượt xem ", error: error.message });
  }
};

//search
export const searchProducts = async (req, res) => {
  try{
    const { q } = req.query;

    //kiểm tra có từ khóa k
    if(!q || q.trim() === ''){
      return res.status(400).json({message: 'Vui lòng nhập từ khóa tìm kiếm'})
    }

    //tìm kiếm sp
    const products = await Product.find({
      $or: [
        {name: { $regex: q, $options: 'i' }}, //regex là tìm kiếm theo pattern nhen và option i cũng v
        {description: {$regex: q, $options: 'i'}}
      ]
    }).populate("category","name slug");

    res.json({
      query: q,
      count: products.length,
      products:  products
    });
  }catch(error){
    res.status(500).json({message: 'Lỗi khi tìm kiếm sản phẩm', error:error.message})
  }
}
