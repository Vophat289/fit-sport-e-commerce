import Product from "../models/product.model.js";

//lấy toàn bộ sản phẩm
 export const getAllProducts = async (req, res) => {
    try{
        const products = await Product.find();
        res.json(products)
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

//thêm sản phẩm
 export const createProduct = async (req, res) => {
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
export const updateProduct = async (req, res) => {
    try{
        
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

//xóa sản phẩm
export const deleteProduct = (req, res) => {
    try{

    }catch(error){
        res.status(500).json({message: error.message});
    }
}

