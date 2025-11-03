# fit-sport-e-commerce

console.log("ile nhận được:", req.file);
        const {name, description} = req.body;
        const slug =  slugify(name, {lower: true, locale: "vi"}); //tao slug tu ten

        //kiểm tra nếu name k tồn tại hoặc name rỗng thì k gửi được và trả về lỗi 400
        if(!name || name.trim() === ""){
            return res.status(400).json({message: "Tên danh mục bắt buộc"});
        }

        //ktra slug da co chua
        const exiting = await Category.findOne({ slug });
        if(exiting){
            return res.status(400).json({message: "Danh mục đã tồn tại"})
        }

        let imageUrl = ""; //Upload ảnh lên cloudinary 
        if(req.file){
            const upload = await cloudinary.uploader.upload(req.file.path, {
                folder: "fit_sport/categories",
            })
            imageUrl = upload.secure_url;
            fs.unlinkSync(req.file.path); //xóa file tạm
        }
      
        //Tạo mới
        const category = await Category.create({name, slug, description, image: imageUrl});
        res.status(201).json(category);