import Product from "../models/product.model.js";

//lấy toàn bộ sản phẩm
const getAllProducts = async (req, res) => {
    try{
        const products = await Product.find();
        res.json(products)
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

//thêm sản phẩm
const createProduct = async (req, res) => {
    try{
        const {name, price, description} = req.body;
        const newProduct = new Product({name, price, description});
        const saved = await newProduct.save();
        res.status(200).json({message: error.message})
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

//cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try{

    }catch(error){
        res.status(500).json({message: error.message});
    }
}

//xóa sản phẩm
const deleteProduct = (req, res) => {
    try{

    }catch(error){
        res.status(500).json({message: error.message});
    }
}

export default {
    getAllProducts, createProduct, updateProduct, deleteProduct
}