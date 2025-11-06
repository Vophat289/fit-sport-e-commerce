import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

//lấy toàn bộ sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name");
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Lỗi khi lấy danh sách sản phẩm",
        error: error.message,
      });
  }
};

//thêm sản phẩm
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const images = [];

    //ảnh gửi lên uplaod tưng file ảnh lên Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        console.log("☁️ Upload thành công:", result.secure_url);
        images.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    } else {
      console.log("không có ảnh nào được gửi lên");
    }

    const newProduct = new Product({
      name,
      price,
      description,
      category,
      images,
    });
    const savedProduct = await newProduct.save();
    res
      .status(201)
      .json({ message: "Thêm sản phẩm thành công", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//xóa sản phẩm
export const deleteProduct = (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
