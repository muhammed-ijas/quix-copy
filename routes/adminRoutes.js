const express =  require("express");
const admin_route = express();
const session = require("express-session");
const multer = require('multer');
const MongoStore = require("connect-mongo"); // Import MongoStore




const config = require("../config/config");

// admin_route.use(session({secret:config.sessionSecret}));

admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, // Avoid resaving session on each request
      saveUninitialized: true, ////  Save sessions that are uninitialized
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // MongoDB URI from .env file
        ttl: 14 * 24 * 60 * 60, // 14 days session expiration time
      }),
      cookie: { secure: false } // Se
    })
  );

//Nocache
const nocache = require("nocache");
admin_route.use(nocache());

admin_route.set('view engine' , 'ejs')
admin_route.set('views','./views/admin');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});


const upload = multer({ storage: storage });
admin_route.use(express.static('public'));


//auth set
const authMiddleware = require("../middleware/auth");

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));


const adminController = require("../controllers/adminController");
const productController =require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const orderController = require("../controllers/orderController");
const offerController = require("../controllers/offerController");
const couponController = require("../controllers/couponController");
const bannercontroller = require("../controllers/bannercontroller");

admin_route.get('/admin',adminController.adminLoginLoad)
admin_route.post('/adminVerifyLogin',adminController.adminVerifyLogin)

admin_route.get('/adminHome',authMiddleware.checkIsAdmin,adminController.loadHome);

admin_route.get('/loadUsers',authMiddleware.checkIsAdmin,adminController.loadUsers);
admin_route.post('/adminBlockUser',authMiddleware.checkIsAdmin,adminController.adminBlockUser);

admin_route.get('/forgetPassAdmin',adminController.adminLoadForget);
admin_route.post('/adminForgetPass',adminController.adminforgetPass);
admin_route.post('/admin-verify-otp-forgot-password',adminController.adminVerifyOtpForgotPassword);
admin_route.post('/admin-reset-password',adminController.adminResetPassword);


admin_route.get('/loadCategories',authMiddleware.checkIsAdmin,categoryController.adminLoadCategories);
admin_route.get('/loadAddCategories',authMiddleware.checkIsAdmin,categoryController.loadAddCategories);
admin_route.post('/adminInsertCategory',authMiddleware.checkIsAdmin,categoryController.adminInsertCategory);
admin_route.post('/updateCategory',authMiddleware.checkIsAdmin,categoryController.adminupdateCategory);

//products
admin_route.get('/loadProducts',authMiddleware.checkIsAdmin,productController.adminLoadProducts);
admin_route.get('/addProduct' , authMiddleware.checkIsAdmin,productController.adminLoadAddProduct);
admin_route.post('/adminInsertProduct', upload.array('image', 3), productController.adminInsertProduct);
admin_route.post('/adminListProduct',authMiddleware.checkIsAdmin,productController.adminListProduct);
admin_route.post('/adminEditProductLoad',productController.adminEditProductLoad);

admin_route.post('/adminSaveProduct', authMiddleware.checkIsAdmin, upload.array('newImage', 3), productController.adminSaveProduct);


admin_route.get('/download-pdf',authMiddleware.checkIsAdmin,adminController.downloadPdf)


admin_route.get('/loadOrders',authMiddleware.checkIsAdmin, orderController.adminLoadOrder);
admin_route.post('/adminViewSingleOrder',authMiddleware.checkIsAdmin,orderController.adminViewSingleOrder);
admin_route.put('/updateOrderStatus/:orderId/:productId',authMiddleware.checkIsAdmin, orderController.updateOrderStatus);


admin_route.get('/api/payment-methods',authMiddleware.checkIsAdmin, adminController.doughnutChart);
admin_route.get('/api/income',authMiddleware.checkIsAdmin,adminController.pastIncomes);

// admin_route.get('/addProduct',productController.insertProduct);

//sales report

admin_route.post('/api/sales-report',authMiddleware.checkIsAdmin, adminController.fetchSalesReport);



//search
admin_route.post('/searchUsers', authMiddleware.checkIsAdmin,adminController.searchUsers);
admin_route.get('/searchUsers',authMiddleware.checkIsAdmin,adminController.loadUsers);
admin_route.post('/searchCategories' ,authMiddleware.checkIsAdmin, adminController.searchCategories);

admin_route.post('/searchProducts',authMiddleware.checkIsAdmin,adminController.searchProducts);

admin_route.get('/adminLogout',adminController.adminLogout);



admin_route.get('/profitGraphMonth',authMiddleware.checkIsAdmin,orderController.profitShowingGraphOfMonths);
admin_route.get('/productStatusCounts',authMiddleware.checkIsAdmin,orderController.getProductStatusCounts)



//offer
admin_route.get('/loadOffers',authMiddleware.checkIsAdmin,adminController.adminLoadOffers);
admin_route.get('/adminAddOffer',authMiddleware.checkIsAdmin,adminController.adminAddOffer);
admin_route.post('/adminInsertOffer',authMiddleware.checkIsAdmin,adminController.adminInsertOffer);
admin_route.post('/adminDeleteOffer',authMiddleware.checkIsAdmin,offerController.deleteOffer);
admin_route.post('/adminAddOfferToProduct',authMiddleware.checkIsAdmin,offerController.addOfferToProduct);
admin_route.post('/removeOfferFromProduct',authMiddleware.checkIsAdmin,offerController.removeOffer);



//coupons
admin_route.get('/loadCoupons',authMiddleware.checkIsAdmin,couponController.adminLoadCoupon);
admin_route.get('/adminAddCoupon',authMiddleware.checkIsAdmin,couponController.adminAddCoupon);
admin_route.post('/adminInsertCoupon',authMiddleware.checkIsAdmin,couponController.adminInsertCoupon);
admin_route.post('/adminDeleteCoupon',authMiddleware.checkIsAdmin,couponController.adminDeleteCoupon);



//banners
admin_route.get('/loadBanners',authMiddleware.checkIsAdmin,bannercontroller.loadAdminBanners);
admin_route.get('/addBanner',authMiddleware.checkIsAdmin,bannercontroller.loadAddBanner);
admin_route.post('/adminInsertBanner',authMiddleware.checkIsAdmin, upload.single('image'), bannercontroller.adminInsertBanner);
admin_route.post('/adminListBanner',authMiddleware.checkIsAdmin,bannercontroller.adminListBanner);
admin_route.post('/adminDeleteBanner',authMiddleware.checkIsAdmin,bannercontroller.adminDeleteBanner);


module.exports = admin_route;