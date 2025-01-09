const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const { loginLoad } = require('./userController');
const Offer = require('../models/offerModel');

//user side product showing
const loadProducts = async(req,res)=>{
    try {
        const allProducts =await Product.find({is_listed:0})
        const allCategories = await Category.find({ is_listed: 0});
        
        res.render('products',{products:allProducts,categories:allCategories});
    } catch (error) {
        console.log(error.message);
    }
};

const loadSingleProduct = async(req,res)=>{
    
    try {
        const id=req.query.id;
        const product =await Product.findOne({_id:id})
        // console.log(product);
        res.render('singleProduct',{product:product});
    } catch (error) {
        console.log(error.message);
    };
};


//admin side product showing
const adminLoadProducts = async (req,res)=>{
    try {
        
        const allProducts = await Product.find({});
        
        
        const allCategories = await Category.find({ is_listed: 0 });

        const activeOffers = await Offer.find({ expiryDate: { $gte: new Date() } });

        res.render('adminProducts',{products:allProducts,categories:allCategories,offers:activeOffers});

    } catch (error) {

        console.log(error.message);
    }
};


//add product field for admin
const adminLoadAddProduct = async(req,res)=>{
    try {
        const allCategories = await Category.find({ is_listed: 0 });
        res.render('adminAddProduct',{categories:allCategories});
    } catch (error) {
        console.log(error.message);
    }
}



//product insert by admin post
const adminInsertProduct = async (req,res)=>{
    try { 
         
        const existingProduct = await Product.findOne({ productName: req.body.productName });
        if (existingProduct) {
           
            const allCategories = await Category.find({ is_listed: 0 });
            return res.render('adminAddProduct', {message: 'Product already exists', categories: allCategories });
        }

     
        const product = new Product({
            productName: req.body.productName,
            prize: req.body.prize,
            stock: req.body.stock,
            categoryName: req.body.categoryName,
            images: req.files.map(file => file.filename), 
        });

      
        await product.save();

      
        const allCategories = await Category.find({ is_listed: 0 });

        
        res.render('adminAddProduct', { message: 'Product added successfully...', categories: allCategories });
   



       
        
    } catch (error) {
        console.log(error.message);
    }
};




const adminListProduct = async (req, res) => {

    

    try {
        const productId = req.body.productId;
        const product = await Product.findById(productId);
        product.is_listed = !product.is_listed;
        await product.save();
       res.status(200).json({isListed: product.is_listed })
    } catch (error) {
        console.error(error.message);
       
    }
};

const adminEditProductLoad = async(req,res)=>{

    const productId = req.body.productId
    try {
        const productData = await Product.findById({_id:productId});
        const allCategories = await Category.find({ is_listed: 0});
        res.render('adminEditProduct',{product:productData,categories:allCategories});


       
    } catch (error) {
        console.error(error.message);
    }
}

const adminSaveProduct = async (req, res) => {
    try {
        
        const productId = req.body.productId; 
        const product = await Product.findById(productId);

        
        product.productName = req.body.productName;
        product.prize = req.body.prize;
        product.stock = req.body.stock;
        product.categoryName = req.body.categoryName;

        
        if (req.files && req.files.length > 0) {
            product.images = req.files.map(file => file.filename);
        }

        await product.save();
        const allCategories = await Category.find({ is_listed: 0});
        
        res.render('adminEditProduct',{message:"product successfully saved",product:product,categories:allCategories});
    } catch (error) {
        console.log(error.message);
        
    }
};



const searchProducts = async (req, res) => {

    
    try {
        //  req.session.searchName = req.body.search;
         

        if(req.session.categoryname){

            let searchQuery = req.body.search;
            
        searchQuery = searchQuery.replace(/\s/g, '');
        const categoryName = req.session.categoryname;
        delete req.session.categoryname;

        let query = { productName: { $regex: new RegExp(searchQuery, 'i') } };

       
        if (categoryName) {
            query.categoryName = categoryName;
        }

        const products = await Product.find(query);
        const allCategories = await Category.find({ is_listed: 0 });
        
        res.render('products', { products, categories: allCategories });

        }else{

        


        const categoryname = req.session.categoryname;
        console.log(categoryname);
        let searchQuery = req.body.search;
        searchQuery = searchQuery.replace(/\s/g, '');
        

        const products = await Product.find({ productName: { $regex: new RegExp(searchQuery, 'i') } });
       

        
       
        const allCategories = await Category.find({ is_listed: 0});
        
        res.render('products',{products,categories:allCategories});

        }
        
    } catch (error) {
        console.error(error);
        
    }
};

const loadProductsByCategory = async(req,res)=>{

    try {

        req.session.categoryname = req.query.categoryName;
      
        
         const categoryName = req.query.categoryName;
         const products = await Product.find({ categoryName: categoryName ,is_listed: 0});
         const allCategories = await Category.find({ is_listed: 0});
         res.render('products',{products,categories:allCategories});

    } catch (error) {
        console.log(error.message);
    }
}

const priceFilterLtoH = async(req,res)=>{
    try {
        if(req.session.categoryname){
            const categoryname = req.session.categoryname;

            const products = await Product.find({is_listed: 0,categoryName:categoryname}).sort({ prize: 1 });
            const allCategories = await Category.find({ is_listed: 0});
            res.render('products',{products,categories:allCategories});

        }else{
        const products = await Product.find({is_listed: 0}).sort({ prize: 1 });
        const allCategories = await Category.find({ is_listed: 0});
        res.render('products',{products,categories:allCategories});

        }
        
    } catch (error) {
        console.log(error.message);
    }
}
const priceFilterHtoL = async(req,res)=>{
    try {
       
        if(req.session.categoryname){
            const categoryname = req.session.categoryname;


            const products = await Product.find({is_listed: 0,categoryName:categoryname}).sort({ prize: -1 });
            const allCategories = await Category.find({ is_listed: 0});
            res.render('products',{products,categories:allCategories});

        }else{
            const products = await Product.find({is_listed: 0}).sort({ prize: -1 });
            const allCategories = await Category.find({ is_listed: 0});
            res.render('products',{products,categories:allCategories});

        }
        
        
    } catch (error) {
        console.log(error.message);
    }
}





module.exports={
    loadProducts,
    loadSingleProduct,
    adminLoadProducts,
    adminLoadAddProduct,
    adminInsertProduct,
    adminListProduct,
    adminEditProductLoad,
    adminSaveProduct,
    searchProducts,
    loadProductsByCategory,
    priceFilterLtoH,
    priceFilterHtoL
}