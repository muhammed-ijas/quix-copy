const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const nodemailer = require("nodemailer");

const PDFDocument = require("pdfkit");

const bcrypt = require('bcrypt')

const adminLoginLoad = async(req,res)=>{
    try {
        
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
};

const downloadPdf = async (req, res) => {
    try {
      res.download("sales_report.pdf");
    } catch (error) {
      console.log(error.message);
    }
};

const adminVerifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email}) ;

        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_admin!=1){

                    res.render('adminLogin' ,{message : "you are not an Admin"})
                }else{
                    req.session.admin = userData;
                    res.redirect('/adminHome');
                }
            }else{
                res.render('AdminLogin',{message:"Email or password is incorrect"})
            }

        }else{
            res.render('AdminLogin',{message:"Email or password is incorrect"})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


//load home

const loadHome =async(req,res)=>{
    
        try {
            const aggregationPipeline = [
                {
                    $match: {
                        is_verified: true,
                        is_admin: 0
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalUsers: 1
                    }
                }
            ];
    
            const [usersData] = await User.aggregate(aggregationPipeline);
    
            const totalUsers = usersData ? usersData.totalUsers : 0;
            const joinPercentage = (totalUsers / 1000) * 100;

            // Calculate current revenue
        const ordersForRevenue = await Order.find();
        let currentRevenue = 0;
        for (const order of ordersForRevenue) {
            currentRevenue += order.subTotal;
        }

        // Calculate percentage change
        let percentageChangeForCurrentRevenue = 0;
        if (currentRevenue > 100000) {
            percentageChangeForCurrentRevenue = 11; // Set a fixed percentage for demonstration, you can calculate dynamically
        } else {
            percentageChangeForCurrentRevenue = (currentRevenue - 100000) / 1000; // For example, decreasing by $1000 for every $10000 below 1 lakh
        }


        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get orders placed today
        const ordersForDailyIncome = await Order.find({
            orderedDate: {
                $gte: today
            }
        });

        // Calculate daily income
        let dailyIncome = 0;
        for (const order of ordersForDailyIncome) {
            dailyIncome += order.subTotal;
        }

        // Calculate percentage change
        let percentageChangeForDaily = 0;
        if (dailyIncome > 20000) {
            percentageChangeForDaily = 5; // Set a fixed percentage for demonstration, you can calculate dynamically
        } else {
            percentageChangeForDaily = (dailyIncome - 20000) / 1000; // For example, decreasing by $1000 for every $10000 below 20000
        }

       
        // Fetch pending orders
        const pendingOrders = await Order.find({ 'products.status': 'pending' });

        // Calculate the total number of pending orders
        const totalPendingOrders = pendingOrders.length;

        const orders = await Order.find({}).populate('userId').populate('products.productId');  
        

        res.render('adminHome', {orders, totalUsers, joinPercentage,currentRevenue,percentageChangeForCurrentRevenue,percentageChangeForDaily,dailyIncome,totalPendingOrders});
        
    } catch (error) {
        console.log(error.message);
    }
}
    

const doughnutChart = async (req, res) => {
    try {
      // Count occurrences of COD and Online Payment methods
      const codCount = await Order.countDocuments({ paymentMethod: 'COD' });
      const onlinePaymentCount = await Order.countDocuments({ paymentMethod: 'Online Payment' });
  
      // Send the counts as a JSON response
      res.json({ codCount, onlinePaymentCount });
    } catch (error) {
      // Handle errors
      console.error('Error fetching payment method counts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


//loadUsers

const loadUsers = async (req,res)=>{
    try {

        const allUser = await User.find({is_admin:0});
        
        
        res.render('adminUsers',{users:allUser});
    } catch (error) {
        console.log(error.message);
    }
};



const adminBlockUser = async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findById(userId);
        user.is_blocked = !user.is_blocked;
        await user.save();

        console.log('get  block  successfully');

        res.json({ success: true, isBlocked: user.is_blocked });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, error: error.message });
    }
}

//loadOffers

const adminLoadOffers = async(req,res)=>{
    try {
        const allProducts = await Product.find({});
        
        
        const allCategories = await Category.find({ is_listed: 0 });

        const allOffers = await Offer.find({})
        console.log(allOffers);

        res.render('adminOffers',{products:allProducts,categories:allCategories,offers:allOffers});
       
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, error: 'Error toggling user block status' });
    }
}



//load add offer by admin

const adminAddOffer = async(req,res)=>{
    try {
        res.render('adminAddOffer')
    } catch (error) {
        console.log(error.message);
    }
};


const adminInsertOffer = async(req,res)=>{
    try {
        
        if (!/^[a-zA-Z].*[a-zA-Z].*[a-zA-Z]/.test(req.body.offerName)) {
            return res.render('adminAddOffer', { message: "Offer name must contain at least three alphabetic characters." });
        }
     
        const existingOffer = await Offer.findOne({ offerName: req.body.offerName });
        if (existingOffer) {
            return res.render('adminAddOffer', { message: "An offer with the same name already exists." });
        }

       
        const offer = new Offer({
            offerName: req.body.offerName,
            discountPercentage: req.body.discountPercentage,
            expiryDate: req.body.expiryDate,
            status: req.body.status
        });
        await offer.save();

        res.render('adminAddOffer', { message: "Offer added successfully." });
        
    } catch (error) {
        console.log(error.message);
    }
}




const pastIncomes = async (req, res) => {
    try {
      // Calculate the date range for the past 6 days
      const currentDate = new Date();
      const sixDaysAgo = new Date(currentDate);
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6); // Subtract 6 days from the current date
  
      // Fetch orders within the date range
      const orders = await Order.find({
        orderedDate: { $gte: sixDaysAgo, $lte: currentDate }
      });
  
      // Calculate income for each day
      const incomeData = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const incomeForDay = orders.reduce((totalIncome, order) => {
          if (order.orderedDate.getDate() === date.getDate()) {
            return totalIncome + order.subTotal;
          }
          return totalIncome;
        }, 0);
        incomeData.unshift(incomeForDay); 
      }
  
      res.json({ incomeData });
    } catch (error) {
      console.error('Error fetching income data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }



const fetchSalesReport = async(req,res)=>{
    try {
        const { selectedDate, reportType } = req.body;

        console.log(req.body);

    // Create date objects for the selected date
    const startDate = new Date(selectedDate);
    let endDate;

    // Determine the end date based on the report type
    if (reportType === 'dailyReport') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
    } else if (reportType === 'monthlyReport') {
      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
    } else if (reportType === 'yearlyReport') {
      endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
    }else{
        console.log("haaai");
    }

    
    const orders = await Order.find({
        orderedDate: {
          $gte: startDate,
          $lt: endDate
        }
      }).populate('userId').populate('products.productId');
      


   

    
    res.status(200).json(orders);
        
    } catch (error) {
        console.log(error.message);
    }
}





const searchUsers = async(req,res)=>{
    try {
    const search = req.body.search;
    
    
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } }, 
        { email: { $regex: search, $options: 'i' } } 
      ]
    });
  
    res.render('adminUsers',{users:users});
    
        
    } catch (error) {
        console.log(error.message);
    }
}


const searchProducts = async(req,res)=>{
    try {
    const search = req.body.search;

        
    const products = await Product.find({
        $or: [
          { productName: { $regex: search, $options: 'i' } }, 
          { categoryName: { $regex: search, $options: 'i' } } 
        ]
      });

      const activeOffers = await Offer.find({ expiryDate: { $gte: new Date() } });

    
        
      res.render('adminProducts',{products:products ,offers :activeOffers});


    } catch (error) {
        console.log(error.message);
    }
}


const searchCategories = async(req,res)=>{
    try {

        const search = req.body.search;

        const newSearch = new RegExp(search.trim(), 'i');

   
        const allCategories = await Category.find({ categoryName: newSearch });
        
        
        
        res.render('adminCategories',{categories:allCategories});
        
    } catch (error) {
        console.log(error.message);
    }
}




const adminLogout = async(req,res)=>{
    try {
        
        req.session.admin = {};
        
        res.render('adminLogin');

    } catch (error) {
        console.log(error.message);
    }
}

const adminLoadForget = async(req,res)=>{
    try {
        res.render('adminForgetPass')
    } catch (error) {
        console.log(error.message);
    }
}


const adminforgetPass = async(req,res)=>{
    try {
        const email = req.body.email;

        const user = await User.findOne({email:req.body.email});

        
     if (!user) {
         return res.render('adminForgetPass', { message: 'No Admin found with this email address' });
     }

     // Generate a new OTP
     const otp = Math.floor(100000 + Math.random() * 900000).toString();
     const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
     const expiration = Date.now() + expiryTime;

     // Save OTP details to the user
     user.resetPasswordOTP = otp;
     user.resetPasswordOTPExpiration = expiration;

     console.log(user);

     await user.save();


     const transporter = nodemailer.createTransport({
         host: 'smtp.gmail.com',
         port: 587,
         secure: false,
         requireTLS: true,
         auth: {
             user: 'muhammedijas793@gmail.com',
             pass: 'arxk jdfv rwjr flcq'
         }
     });
     const mailOptions = {
         from: 'muhammedijas793@gmail.com',
         to: email,
         subject: 'OTP for Reset Password',
         html: `<p>Your OTP for password reset is: ${otp}</p>`
     }
     transporter.sendMail(mailOptions, (error, info) => {
         if (error) {
             console.log(error);
         } else {
             console.log("Password reset OTP has been sent to the email");
         }
     });

     res.render('adminEnterOTPForgotPassword', { email, message:"Check your  gmail for OTP"});

    

    } catch (error) {
        console.log(error.message);
    }
}


const adminVerifyOtpForgotPassword = async(req,res)=>{
    try {

        const { email, otp } = req.body;
        const user = await User.findOne({ email, resetPasswordOTP: otp, resetPasswordOTPExpiration: { $gt: Date.now() } });

        if (user) {
            
            res.render('adminResetPasswordForm', { email });
        } else {
            res.render('adminEnterOTPForgotPassword', { email, message: 'Invalid or expired OTP' });
        }
            
        } catch (error) {
            console.log(error.message);
        }
}

const adminResetPassword = async(req,res)=>{
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email: email });

    if (!user) {
        return res.render('adminEnterOTPForgotPassword', { email, message: 'Invalid or expired OTP' });
    }

    const spassword = await securePassword(newPassword);
    user.password = spassword;


    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiration = undefined;

   

    await user.save();

    res.render('adminLogin',{ message: 'Password successfully changed' });


    } catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password)=>{
    try {
        
        const passwordHash =await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}







module.exports ={
    adminVerifyLogin,
    adminLoginLoad ,
    loadHome,
    loadUsers,
    adminBlockUser,
    adminLoadOffers,
    adminAddOffer,
    adminInsertOffer,
    doughnutChart,
 pastIncomes ,
 fetchSalesReport,
 searchUsers,
 searchProducts,
 searchCategories,
 adminLogout,
 adminLoadForget,
 adminforgetPass,
 adminVerifyOtpForgotPassword,
 adminResetPassword,
 downloadPdf

    
   

}