const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const Coupon = require('../models/couponModel');
const Banner = require('../models/bannerModel');



const loadAdminBanners = async(req,res)=>{
    try {
        const banners = await Banner.find({})
        res.render('adminBanners',{banners:banners});
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddBanner = async(req,res)=>{
    try {
        res.render('adminAddBanner')
    } catch (error) {
        console.log(error.message);
    }
}


const adminInsertBanner = async (req,res)=>{
    try {

        const existingBanner= await Banner.findOne({ bannerName: req.body.bannerName });

        if (existingBanner) {
           
            
            return res.render('adminAddBanner', {message: 'Banner already exists with this name'});
        }

     
        const banner = new Banner({
            bannerName: req.body.bannerName,
            description: req.body.description,
            link: req.body.link,
            image: req.file.filename, // Assuming req.file contains the uploaded image
        });
      
        await banner.save();

      
        

        
        res.render('adminAddBanner', { message: 'Banner added successfully...' });
   

        
    } catch (error) {
        console.log(error.message);
    }
}

const adminListBanner = async(req,res)=>{
    try {
        const bannerId = req.body.bannerId;
        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

       
        banner.is_listed = !banner.is_listed;
        await banner.save();

        
        res.json({ is_listed: banner.is_listed });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const adminDeleteBanner = async(req,res)=>{
    try {
        const bannerId = req.body.bannerId;
        const banner = await Banner.findByIdAndDelete(bannerId);

        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}






module.exports={
    loadAdminBanners,
    loadAddBanner,
    adminInsertBanner,
    adminListBanner,
    adminDeleteBanner
    
}

