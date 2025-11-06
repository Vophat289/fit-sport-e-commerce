import Category from '../models/category.model.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
export const getAllCategories = async (req, res) => {
    try{
        const categories = await Category.find().sort({createdAt: -1});
        console.log(categories);
        
      return res.status(200).json(categories)
    }catch(error){
        res.status(500).json({message: error.message});
    }
};


export const createCategory = async (req, res) => {
    try{
        const {name, description} = req.body;
        const slug =  slugify(name, {lower: true, locale: "vi"}); //tao slug tu ten

        //kiểm tra nếu name k tồn tại hoặc name rỗng thì k gửi được và trả về lỗi 400
        if(!name || name.trim() === ""){
            return res.status(400).json({message: "Tên danh mục bắt buộc"});
        }

        let imageUrl = "";

        //nếu thêm ảnh
        if(req.file){
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "categories", //categories là folder trên cloudinary
            });

            imageUrl = result.secure_url; 
            fs.unlinkSync(req.file.path) //xóa ảnh 
        }

        //ktra slug da co chua
        const exiting = await Category.findOne({ slug });
        if(exiting){
            return res.status(400).json({message: "Danh mục đã tồn tại"})
        }
        //Tạo mới
        const category = await Category.create({name, slug, description, image: imageUrl });
        const saved = await category.save();

        res.status(201).json(saved);
        
    }catch(error){
        res.status(500).json({message: "Lỗi khi tạo danh mục",   error: error.message, 
    stack: error.stack})
}
}

export const updateCategory = async (req, res) => {
    try{
        const { id } = req.params;
        const { name, description} = req.body;

        //kiểm tra có tồn tại k
        const category = await Category.findById(id);
        if(!category){
            return res.status(404).json({message:"Không tìm thấy danh mục"})
        }

        //nếu file có ảnh mới thì upload lên cloudinary
        if(req.file){
            const uploadResult = await cloudinary.uploader.rename(req.file.path, {
                folder: "categories",
            });

            //xóa file ảnh cũ nếu mún
            category.image = uploadResult.secure_url;
            fs.unlinkSync(req.file.path);
        }

        //cập nhật dữ liệu
        if(name?.trim()){
            category.name = name.trim();
            category.slug = slugify(name, {lower: true, locale: "vi"});
        }
        if(description !== undefined){
            category.description = description;
        }

        await category.save();
        res.status(200).json({message:"Cập nhật danh mục thành công", category});

  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục!", error });
  }
};

export const deleteCategory = async (req, res) => {
    try{
        const {id} = req.params;
        const deleted = await Category.findByIdAndDelete(id);
        
        if(!deleted){
            return res.status(404).json({message: "Không tìm thấy danh mục !"})
        }
        res.status(200).json({message: "Đã xóa danh mục thành công !"});

    }catch(error){
        res.status(500).json({message:"Lỗi khi khi xóa danh mục !",error})
    }
}

// Lấy danh mục theo id (slug)
export const getCategoryBySlug = async (req, res) => {
    try{
        const {slug} = req.params;

        const getSlug = await Category.findOne({slug});

        if(!getSlug){
            return res.status(404).json({message: "Không thể tìm thấy danh mục"})
        }
        res.status(200).json(getSlug)
    }catch(error){
        res.status(500).json({message:"Lỗi khi lấy danh mục theo slug", error})
    }
}