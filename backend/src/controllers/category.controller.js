import Category from '../models/category.model.js';
import slugify from 'slugify';

export const getAllCategories = async (req, res) => {
    try{
        const categories = await Category.find().sort({createAt: -1});
        res.json(categories)
    }catch(error){
        res.status(500).json({message: error.message});
    }
};


export const createCategory = async (req, res) => {
    try{
        const {name, description} = req.body;
        const slug =  slugify(name, {lower: true, locale: "vi"})//tao slug tu ten

        //kiểm tra nếu name k tồn tại hoặc name rỗng thì k gửi được và trả về lỗi 400
        if(!name || name.trim() === ""){
            return res.status(400).json({message: "Tên danh mục bắt buộc"});
        }

        //ktra slug da co chua
        const exiting = await Category.findOne({ slug });
        if(exiting){
            return res.status(400).json({message: "Danh mục đã tồn tại"})
        }
        //Tạo mới
        const category = await Category.create({name, slug, description});
        res.status(201).json(category);
        
    }catch(error){
        res.status(500).json({message: "Lỗi khi tạo danh mục",   error: error.message, 
    stack: error.stack})
}
}

export const updateCategory = async (req, res) => {
    try{
        const { id } = res.params;
        const { name, description} = req.body;

        const slug = slugify (name, {lower: true, locale: "vi"})

        const updated = await Category.findByIdAndUpdate(
            id,
            {name, slug, description},
            {new : true}
        );

        if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }

    res.status(200).json(updated);
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
        res.status(500).json({message:"Lỗi khi khi xóa sản phẩm !",error})
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