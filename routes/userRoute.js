const express = require("express");
const user_route = express();
const session = require("express-session");
const MongoStore = require("connect-mongo");


const config = require("../config/config");

// user_route.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: true }));

user_route.use(session({
    secret: config.sessionSecret ,
    resave: false, // Don't resave session if not modified
    saveUninitialized: true, // Save session even if it's not modified
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // Your MongoDB URI
        ttl: 14 * 24 * 60 * 60 // 14 days session expiration time
    }),
    cookie: { secure: false } // Set to true if you're using HTTPS
}));

user_route.set('view engine', 'ejs')
user_route.set('views', './views/users');

const nocache = require("nocache");
user_route.use(nocache());

//auth set
const authMiddleware = require("../middleware/auth");

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }))


const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const { razorPayOrder, verifyPayment } = require("../controllers/razorpay");
const offerController = require("../controllers/offerController");
const couponController = require("../controllers/couponController");
const bannercontroller = require("../controllers/bannercontroller");



user_route.get('/register', authMiddleware.isLogout, userController.loadRegister);

user_route.post('/register', userController.insertUser);


user_route.post('/verifyOTP', userController.verifyOTP);

user_route.get('/resendOTP', userController.resendOTP);



//forgetPass

user_route.get('/forgetPass', authMiddleware.checkBlockedByAdmin, userController.forgetLoad);
user_route.post('/forgetPass', userController.forgetPass);
user_route.post('/verify-otp-forgot-password', userController.verifyOtpForgotPassword);
user_route.post('/reset-password', userController.resetPassword)


//home
user_route.get('/', authMiddleware.checkBlockedByAdmin, userController.loadHome);
user_route.get('/home', authMiddleware.checkBlockedByAdmin, userController.loadHome);

//login
user_route.get('/login', authMiddleware.isLogout, userController.loginLoad)
user_route.post('/login', userController.verifyLogin);


//features
user_route.get('/features', userController.loadFeatures);



//shop
user_route.get('/products', authMiddleware.checkBlockedByAdmin, productController.loadProducts);
user_route.get('/singleProduct', authMiddleware.checkBlockedByAdmin, productController.loadSingleProduct);


//if blocked
user_route.get('/blockedBY', userController.blockedBY);





//cart
user_route.get('/loadCart', authMiddleware.checkBlockedByAdmin,authMiddleware.isLogin,  cartController.loadCart);
user_route.post('/addToCart', authMiddleware.checkBlockedByAdmin, cartController.addToCart);

user_route.post('/removeFromCart', authMiddleware.checkBlockedByAdmin, cartController.removeFromCart);
user_route.post('/update-quantity', cartController.updateQuantity);


//checkout
user_route.post('/toCheckout', orderController.loadCheckout);
user_route.get('/toCheckout', orderController.loadCheckout);
user_route.post('/confirmation', orderController.loadConfirmOrder);


//orders
user_route.get('/viewOrders',authMiddleware.isLogin,  orderController.loadviewOrder);
user_route.get('/viewSingleOrder/:orderId',authMiddleware.isLogin,  orderController.loadViewSingleOrder);
user_route.get('/viewOrderDetails',authMiddleware.isLogin,  orderController.loadviewOrder);
//cancel order
user_route.post('/userCancelOrder', orderController.userCancelOrder);
//return order
user_route.post('/userReturnOrder', orderController.userReturnOrder);


//profile
user_route.get('/userProfile', authMiddleware.checkBlockedByAdmin,authMiddleware.isLogin, userController.userProfile);
user_route.get('/editProfile',authMiddleware.isLogin,  userController.editProfile);
user_route.post('/editUser', userController.editUser);
user_route.get('/toProfile', userController.userProfile);



//address
user_route.post('/editAddress',authMiddleware.isLogin,  userController.loadEditAddress);
user_route.post('/finalEditAddress',authMiddleware.isLogin,  userController.editAddress);
user_route.get('/userAddAddress',authMiddleware.isLogin,  userController.loadUserAddAddress)
user_route.post('/addAddress',authMiddleware.isLogin,  userController.userAddAddress);
user_route.get('/viewEveryAddress',authMiddleware.isLogin,  userController.viewEveryAddress);
user_route.get('/userAddAddressFromProfile',authMiddleware.isLogin,  userController.loadUserAddAddressFromProfile);
user_route.post('/profileAddAddress',authMiddleware.isLogin,  userController.backtoViewAddress);
user_route.post('/deleteAddress', authMiddleware.isLogin, userController.deleteAddress);


//about
user_route.get('/about', authMiddleware.checkBlockedByAdmin, userController.loadAbout)


//search 
user_route.post('/search', productController.searchProducts);


// change password
user_route.get('/changePassword',authMiddleware.isLogin,  userController.loadChangePassword);
user_route.post('/changePassword',authMiddleware.isLogin,  userController.changePassword);



//product shown as per category 
user_route.get('/categoriesFilter', productController.loadProductsByCategory)

//product shown by price filter
user_route.get('/priceFilterLtoH', productController.priceFilterLtoH);
user_route.get('/priceFilterHtoL', productController.priceFilterHtoL);



//payment Razorpay
user_route.post("/create/orderId", razorPayOrder);
user_route.post("/verify-payment", verifyPayment);


//logoute
user_route.get('/userLogout', userController.userLogout);


//wallet
user_route.get('/wallet',authMiddleware.isLogin,  userController.loadWallet);
user_route.post('/checkCouponCode',  couponController.checkCouponCode);



//reviews and rating 
user_route.post('/loadReview',authMiddleware.isLogin,  userController.loadReview)
user_route.post('/addReview',authMiddleware.isLogin,  userController.addReview);




//contactpage
user_route.get('/contact', userController.loadContact);


module.exports = user_route;




