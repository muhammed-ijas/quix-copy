const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const Coupon = require('../models/couponModel');




const adminLoadCoupon = async (req, res) => {
    try {

        const coupons = await Coupon.find({});

        res.render('adminCoupons', { coupons: coupons });

    } catch (error) {
        console.log(error.message);
    }
}

const adminAddCoupon = async (req, res) => {
    try {
        res.render('adminAddCoupon');

    } catch (error) {
        console.log(error.message);
    }
}

const adminInsertCoupon = async (req, res) => {
    try {


        if (!/^[a-zA-Z].*[a-zA-Z].*[a-zA-Z]/.test(req.body.couponName)) {
            return res.render('adminAddCoupon', { message: "Coupon name must contain at least three alphabetic characters." });
        }

        const existingCoupon = await Coupon.findOne({ couponName: req.body.couponName });
        if (existingCoupon) {
            return res.render('adminAddCoupon', { message: "An coupon with the same name already exists." });
        }


        const usageLimit = parseInt(req.body.usageLimit);
        if (isNaN(usageLimit) || usageLimit < 0) {
            return res.render('adminAddCoupon', { message: "Usage limit must be a non-negative number." });
        }


        const discountAmount = parseFloat(req.body.discountAmount);
        if (isNaN(discountAmount) || discountAmount < 0) {
            return res.render('adminAddCoupon', { message: "Discount amount must be a non-negative number." });
        }

        const couponCode = generateCouponCode();

        const expiryDate = new Date(req.body.expiryDate);
        const isActive = expiryDate > new Date();


        const coupon = new Coupon({
            couponCode: couponCode,
            couponName: req.body.couponName,
            discountAmount: req.body.discountAmount,
            minimumSpend: req.body.minimumSpend,
            expiryDate: req.body.expiryDate,
            isActive: isActive,
            usageLimit: req.body.usageLimit,

        });
        await coupon.save();

        res.render('adminAddCoupon', { message: "Coupon added successfully." });

    } catch (error) {
        console.log(error.message);
    }
}

function generateCouponCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let couponCode = '';
    for (let i = 0; i < 8; i++) {
        couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return couponCode;
}


const adminDeleteCoupon = async (req, res) => {
    try {

        const couponId = req.body.couponId;

   

        await Coupon.findByIdAndDelete(couponId);



        res.sendStatus(200);

    } catch (error) {
        console.log(error.message);
    }
}



const checkCouponCode = async (req, res) => {
    try {

        console.log(req.body);
        const couponCode = req.body.couponCode;

        const appliedCoupon = await Coupon.findOne({ couponCode });

        const userId = req.session.users._id;

        const userAddress = await Address.find({ userId });

        const userCart = await Cart.findOne({ userId }).populate('products.productId');

        let appliedCouponAmount = 0;

        let subTotal = req.body.subTotal;

        const coupons = await Coupon.find({
            minimumSpend: { $lte: subTotal },
            isActive: true,
            usageLimit: { $gt: 0 }
        });


        if (appliedCoupon) {

            if (appliedCoupon.userId.includes(userId)) {
                
                return res.render('checkout', { carts: userCart.products, cartId: userCart._id, subTotal, address: userAddress, coupons, errorMessage: 'You have already used this coupon.' });
            } else {

                // User is new to use this coupon
                subTotal -= appliedCoupon.discountAmount;

                appliedCouponAmount = appliedCoupon.discountAmount;
                const appliedCouponMinimumSpend = appliedCoupon.minimumSpend;
                
                appliedCoupon.userId.push(userId);

                await appliedCoupon.save();

                return res.render('checkout', { carts: userCart.products, cartId: userCart._id, subTotal, address: userAddress, coupons,message: "coupon successfully applied",appliedCouponAmount:appliedCouponAmount,appliedCouponMinimumSpend:appliedCouponMinimumSpend});
            }

        } else {
            // No coupon found with the provided code
           
            return res.render('checkout', { carts: userCart.products, cartId: userCart._id, subTotal, address: userAddress, coupons, errorMessage: 'Invalid coupon code.' });
        }



    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    adminLoadCoupon,
    adminAddCoupon,
    adminInsertCoupon,
    adminDeleteCoupon,
    checkCouponCode
}