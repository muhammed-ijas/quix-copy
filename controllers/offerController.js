const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');


const deleteOffer = async(req,res)=>{
    try {
        const offerId = req.body.offerId;

        const offer = await Offer.findOne({_id:offerId});
        const offerName =  offer.offerName;
       
        


        const productsWithOffer = await Product.find({ offerName: offerName });

        if (productsWithOffer.length > 0) {
           
            await Product.updateMany({ offerName: offerName }, {
                $unset: {
                    offerPrice: "",
                    offerPercentage: "",
                    offerName: ""
                }
            });
        }

        await Offer.findByIdAndDelete(offerId);



        
        res.sendStatus(200);

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error deleting offer');

    }
}

const addOfferToProduct = async(req,res)=>{
    try {
        

        const offerName = req.body.offer;
        const productId = req.body.productId;

        console.log(req.body);

        const product = await Product.findById(productId);
        const offer = await Offer.findOne({ offerName: offerName });

        if (offer && offer.discountPercentage !== undefined) {
            const discountPercentage = offer.discountPercentage;
            product.offerPercentage = discountPercentage;
            const offerPrice = product.prize - (product.prize * discountPercentage / 100);
            product.offerPrice = offerPrice;
        } else {
            console.error(`Offer "${offerName}" not found or discountPercentage is undefined.`);
        }

        product.offerName = offerName;
        await product.save();

        const allProducts = await Product.find({});
        const allCategories = await Category.find({ is_listed: 0 });
        const activeOffers = await Offer.find({ expiryDate: { $gte: new Date() } });

        res.render('adminProducts', { products: allProducts, categories: allCategories, offers: activeOffers });
   

       

    } catch (error) {

        console.error(error);

      
    }

}



const removeOffer = async (req, res) => {
    try {
        const productId = req.body.productId;
        const offerName = req.body.offerName;

        const offer = await Offer.findOne({offerName:offerName});
        const offerId = offer._id;

      
        const product = await Product.findByIdAndUpdate(productId, {
            $unset: { offerName: 1, offerPrice: 1 , offerPercentage:1 } 
        }, { new: true });

        await product.save();

        const allProducts = await Product.find({});
        const allCategories = await Category.find({ is_listed: 0 });
        const activeOffers = await Offer.find({ expiryDate: { $gte: new Date() } });

        res.render('adminProducts', { products: allProducts, categories: allCategories, offers: activeOffers });

        

      
        
    } catch (error) {
        console.error('Error removing offer from product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports= {
    deleteOffer,
    addOfferToProduct,
    removeOffer
}
