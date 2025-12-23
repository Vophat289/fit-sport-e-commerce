import Category from '../models/category.model.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
export const getAllCategories = async (req, res) => {
    try{
        const categories = await Category.find().sort({createdAt: -1});
      
        
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

        //kiểm tra bắt buộc phải có file ảnh
        if(!req.file){
            return res.status(400).json({message: "Vui lòng chọn ảnh danh mục"});
        }

        // Kiểm tra loại file - chỉ chấp nhận JPG và PNG
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if(!allowedMimeTypes.includes(req.file.mimetype.toLowerCase())){
            fs.unlinkSync(req.file.path); //xóa file không hợp lệ
            return res.status(400).json({message: "Chỉ chấp nhận file JPG và PNG"});
        }

        let imageUrl = "";

        //upload ảnh lên cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "categories", //categories là folder trên cloudinary
        });

        imageUrl = result.secure_url; 
        fs.unlinkSync(req.file.path) //xóa ảnh tạm

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

        //nếu có file ảnh mới thì upload lên cloudinary
        if(req.file){
            // Kiểm tra loại file - chỉ chấp nhận JPG và PNG
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if(!allowedMimeTypes.includes(req.file.mimetype.toLowerCase())){
                fs.unlinkSync(req.file.path); //xóa file không hợp lệ
                return res.status(400).json({message: "Chỉ chấp nhận file JPG và PNG"});
            }

            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "categories",
            });

            //xóa file ảnh cũ trên cloudinary nếu có
            if(category.image){
                try {
                    // Lấy public_id từ URL cũ
                    const urlParts = category.image.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `categories/${filename.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.warn('Không thể xóa ảnh cũ trên cloudinary:', deleteError);
                }
            }

            category.image = uploadResult.secure_url;
            fs.unlinkSync(req.file.path);
        }
        // Nếu không có file mới, giữ nguyên ảnh cũ (không cần làm gì)

        //cập nhật dữ liệu
        if(name?.trim()){
            category.name = name.trim();
            category.slug = slugify(name, {lower: true, locale: "vi"});
        }
        if(description !== undefined){
            category.description = description;
        }

        //lưu vào database
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