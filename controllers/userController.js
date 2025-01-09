
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Banner = require('../models/bannerModel');
const Offer = require('../models/offerModel');
const Coupon = require('../models/couponModel')
 
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");
const { OrderedBulkOperation } = require('mongodb');


const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const loadChangePassword = async (req, res) => {
    try {
        res.render('changePassword');
    } catch (error) {
        console.log(error.message);
    }
}

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.session.users._id);

        // console.log(user);


        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
        // console.log(isPasswordMatch);

        if (!isPasswordMatch) {
            res.render('changePassword', { message: "Incorrect old password" })
        }

        const sPassword = await securePassword(newPassword);


        user.password = sPassword;

        await user.save();

        const userId = req.session.users._id;

        const address = await Address.findOne({ userId });


        res.render('profile', { user: user, address: address });


    } catch (error) {
        console.log(error.message);
    }
}


const loadRegister = async (req, res) => {

    try {
        let referralCode; 

        if (req.query.referralCode) {
            referralCode = req.query.referralCode;
        }
        res.render('registration', { referralCode: referralCode })
    } catch (error) {
        console.log(error.message);
    }

}





const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expiration = Date.now() + expiryTime;
    return { otp, expiration };
};

const sendOTP = async (name, email, otp) => {
    try {
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
            subject: 'OTP for Two-Step Verification',
            html: `<p>Hii ${name}, your OTP for verification is: ${otp}</p>`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("OTP has been sent to the email");
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}



// const insertUser = async (req, res) => {
//     try {
        

//         const existingUser = await User.findOne({ email: req.body.email });

//         if (existingUser) {
//             return res.render('registration', { message: 'Email is already in use. Please choose a different email.' });
//         }
//         const spassword = await securePassword(req.body.password);

//         let userParams = {
//             name: req.body.name,
//             email: req.body.email,
//             phone: req.body.phone,
//             password: spassword,
//             is_admin: false,
//             is_blocked: 0
//         };
        
//         if (req.body.referralCode) {
//             userParams.referredFrom = req.body.referralCode;
//         }
        
//         const user = new User(userParams);
//         req.session.users = user;

//         if (req.session.users) {
//             const { otp, expiration } = generateOTP();
//             req.session.otp = otp;
//             req.session.otpExpiration = expiration;

//             sendOTP(req.body.name, req.body.email, otp);
//             res.render('OTPregister', { id: req.session.users._id });
//         } else {
//             res.render('registration', { message: 'Your registration has been failed' });
//         }

//     } catch (error) {
//         console.log(error.message);
//     }
// };
const insertUser = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        let referralCode = req.body.referralCode || '';

        if (existingUser) {
            return res.render('registration', { 
                message: 'Email is already in use. Please choose a different email.',
                referralCode: referralCode // pass referralCode if it exists
            });
        }

        const spassword = await securePassword(req.body.password);

        let userParams = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: spassword,
            is_admin: false,
            is_blocked: 0
        };

        if (referralCode) {
            userParams.referredFrom = referralCode;
        }

        const user = new User(userParams);
        req.session.users = user;

        if (req.session.users) {
            const { otp, expiration } = generateOTP();
            console.log(otp);
            
            req.session.otp = otp;
            req.session.otpExpiration = expiration;

            sendOTP(req.body.name, req.body.email, otp);
            res.render('OTPregister', { id: req.session.users._id });
        } else {
            res.render('registration', { 
                message: 'Your registration has failed',
                referralCode: referralCode // pass referralCode if it exists
            });
        }
    } catch (error) {
        console.log(error.message);
        res.render('registration', { 
            message: 'An error occurred during registration. Please try again.',
            referralCode: req.body.referralCode || '' // pass referralCode if it exists
        });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { otp, otpExpiration } = req.session;

        if (otp && Date.now() < otpExpiration) {
            if (otp === req.body.number) {

                function generateRandomString(length) {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                    let result = '';
                    for (let i = 0; i < length; i++) {
                        result += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    return result;
                }

                // Generating a 6-letter referral code
                const referralCode = generateRandomString(6);



                const user = new User(req.session.users);
                user.is_verified = true;

                user.referralCode = referralCode;
                let walletAmount = user.walletAmount;
                
                const usersReferredFrom = await User.find({referredFrom:referralCode});
                const referrelAmount = 100*usersReferredFrom;

                let referredFromUser;
                if (user.referredFrom) {
                    referredFromUser = await User.findOne({ referralCode: user.referredFrom });
                    referredFromUser.walletAmount+=100;
                    await referredFromUser.save();
                    walletAmount += 100;
                }
                walletAmount += referrelAmount;

                user.walletAmount = walletAmount;
                



                await user.save();
                res.render('login', { message1: "Congratulations! You have successfully registered." });
            } else {
                res.render('OTPregister', { id: req.session.users._id, message: 'Invalid OTP' });
            }
        } else {
            res.render('OTPregister', { id: req.session.users._id, message: 'OTP has expired or invalid' });
        }
    } catch (error) {
        console.error(error.message);

    }
};




const blockedBY = async (req, res) => {
    try {
        res.render('blockedBY');
    } catch (error) {
        console.log(error.message);
    }

}







//login user methods

const loginLoad = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

//verify login

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified == false) {

                    res.render('login', { message: "please verify your mail" })
                } else {
                    req.session.users = userData
                    const user = await User.findById(req.session.users._id);
                    if (!user.referralCode) {
                        const referralCode = generateRandomString(6);
                        function generateRandomString(length) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            return result;
                        }
                        user.referralCode = referralCode;
                        await user.save();
                    }
                    res.redirect('/home');
                }
            } else {
                res.render('login', { message: "Email or password is incorrect" })
            }

        } else {
            res.render('login', { message: "Email or password is incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }
}

//loadHome

const loadHome = async (req, res) => {
    try {
        

        const expiredOffers = await Offer.find({ expiryDate: { $lte: new Date() } });

        
        for (const offer of expiredOffers) {
          
            await Product.updateMany({ offerName: offer.offerName }, { $unset: { offerName: 1, offerPrice: 1, offerPercentage: 1 } });
        }

        const allBanners = await Banner.find({ is_listed: 0 });
        const allProducts = await Product.find({ is_listed: 0 });

        res.render('home', { products: allProducts, banners: allBanners });


    } catch (error) {
        console.log(error.message);
    }
}


//forget pasword

const forgetLoad = async (req, res) => {

    try {
        res.render("forgetPass")
    } catch (error) {
        console.log(error.message);
    }

}

//login or userprofile if click user

const userProfile = async (req, res) => {

    try {
        if (req.session.users) {

            const user = await User.findById(req.session.users._id);
            const userId = req.session.users._id;


            res.render('profile', { user: user });

        } else {
            res.render('login')
        }

    } catch (error) {
        console.log(error.message);
    }



}


const editProfile = async (req, res) => {
    try {
        const user = req.session.users;
        res.render('editProfile', { user })
    } catch (error) {
        console.log(error.message);
    }
}

const editUser = async (req, res) => {
    try {

        const { name, phone, email } = req.body;


        const userId = req.session.users._id;

        const user = await User.findById(userId);


        user.name = name;
        user.phone = phone;
        user.email = email;


        await user.save();
        const address = await Address.findOne({ userId })





        res.render('profile', { user: user, address: address });
    } catch (error) {
        console.error(error);

    }
};


const loadAbout = async (req, res) => {
    try {
        res.render('about');
    } catch (error) {
        console.log(error.message);
    }
}


const forgetPass = async (req, res) => {

    try {

        const email = req.body.email;

        const user = await User.findOne({ email: req.body.email });


        if (!user) {
            return res.render('forgetPass', { message: 'No user found with this email address' });
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

        res.render('enterOTPForgotPassword', { email, message: "Check your  gmail for OTP" });


    } catch (error) {
        console.log(error.message);
    }

}




const verifyOtpForgotPassword = async (req, res) => {
    try {

        const { email, otp } = req.body;
        const user = await User.findOne({ email, resetPasswordOTP: otp, resetPasswordOTPExpiration: { $gt: Date.now() } });

        if (user) {
            // Render a form for users to enter a new password
            res.render('resetPasswordForm', { email });
        } else {
            res.render('enterOTPForgotPassword', { email, message: 'Invalid or expired OTP' });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.render('enterOTPForgotPassword', { email, message: 'Invalid or expired OTP' });
        }

        const spassword = await securePassword(newPassword);
        user.password = spassword;


        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpiration = undefined;



        await user.save();

        res.render('login', { message: 'Password successfully changed' });


    } catch (error) {
        console.log(error.message);
    }
}


const resendOTP = async (req, res) => {
    try {
        // Generate a new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const expiration = Date.now() + expiryTime;







        req.session.otp = otp;
        req.session.otpExpiration = expiration;

        const email = req.session.users.email




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
            html: `<p>Your OTP for regiser is : ${otp}</p>`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("resend OTP has been sent to the email");
            }
        });

        res.render('OTPregister', { email, message1: "Check your  gmail for OTP" });




    } catch (error) {
        console.log(error.message);
    }
}




const loadEditAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.body.addressId })
        res.render('editAddress', { address })
    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async (req, res) => {
    try {


        const { houseName, city, pincode, state, country, addressId } = req.body;

        const userId = req.session.users._id;

        const address = await Address.findOne({ _id: addressId })


        address.houseName = houseName;
        address.city = city;
        address.pincode = pincode;
        address.state = state;
        address.country = country;


        await address.save();


        const userAddress = await Address.find({ userId });
        res.render('userViewEveryAddress', { address: userAddress });




    } catch (error) {

        console.log(error.message);

    }
}

const loadUserAddAddress = async (req, res) => {
    try {
        res.render('addAddress');
    } catch (error) {
        console.log(error.message);
    }
}


const userAddAddress = async (req, res) => {

    try {

        const { fullName, phone, houseName, city, pincode, state, country } = req.body;

        const address = new Address({
            userId: req.session.users._id,
            fullName,
            mobile: phone,
            houseName,
            city,
            pincode,
            state,
            country
        });

        await address.save();

        const userId = req.session.users._id;



        const userAddress = await Address.find({ userId });

        const userCart = await Cart.findOne({ userId }).populate('products.productId');

        let subTotal = 0;

        userCart.products.forEach((item) => {
            subTotal += item.productId.prize * item.quantity;
        });

        
        

        const coupons = await Coupon.find({
            minimumSpend: { $lte: subTotal },
            isActive: true,
            usageLimit: { $gt: 0 }
        });


        res.render('checkout', { carts: userCart ? userCart.products : [], cartId: userCart._id, subTotal: subTotal,  coupons: coupons , address: userAddress });


    } catch (error) {
        console.log(error.message);
    }
};


const viewEveryAddress = async (req, res) => {
    try {
        const userId = req.session.users._id;
        const userAddress = await Address.find({ userId });
        res.render('userViewEveryAddress', { address: userAddress });

    } catch (error) {
        console.log(error.message);
    }
}

const loadUserAddAddressFromProfile = async (req, res) => {
    try {
        res.render('profileAddAddress');
    } catch (error) {
        console.log(error.message);
    }
}

const backtoViewAddress = async (req, res) => {
    try {
        const { fullName, phone, houseName, city, pincode, state, country } = req.body;

        const address = new Address({
            userId: req.session.users._id,
            fullName,
            mobile: phone,
            houseName,
            city,
            pincode,
            state,
            country
        });

        await address.save();

        const userId = req.session.users._id;

        const userAddress = await Address.find({ userId });
        res.render('userViewEveryAddress', { address: userAddress });

    } catch (error) {
        console.log(error.message);
    }
}



const deleteAddress = async (req, res) => {
    try {

        const addressId = req.body.addressId;


        const deletedAddress = await Address.deleteOne({ _id: addressId });
        const userId = req.session.users._id;

        const userAddress = await Address.find({ userId });
        res.render('userViewEveryAddress', { address: userAddress });



    } catch (error) {
        console.log(error.message);
    }
}



const loadFeatures = async (req, res) => {
    try {
        res.render('features')
    } catch (error) {
        console.log(error.message);
    }
}



const userLogout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Internal server error');
            }
        });

        const allBanners = await Banner.find({ is_listed: 0 });
        const allProducts = await Product.find({ is_listed: 0 });

        res.render('home', { products: allProducts, banners: allBanners });


    } catch (error) {
        console.log(error.message);
    }
}


const loadWallet = async (req, res) => {

    try {
        const userId = req.session.users._id;
        const userOrder = await Order.find({ userId }).populate('userId').populate('products.productId');
        const user = await User.findOne({ _id: userId });
        let walletAmount = user.walletAmount;

        const referralCode = user.referralCode;
        const usersReferredFrom = await User.find({referredFrom:referralCode});

       

        let referredFromUser;

        if (user.referredFrom) {
            referredFromUser = await User.findOne({ referralCode: user.referredFrom });
           
        }
        
        


        if (walletAmount <= 0) {
            walletAmount = 0;
            
        }

        
        


        await user.save()




        res.render('wallet', { orders: userOrder, walletAmount,usersReferredFrom:usersReferredFrom ,referredFromUser });

    } catch (error) {
        console.log(error.message);
    }

}


const loadReview = async (req, res) => {
    try {
        const productId = req.body.productId;
        const orderId = req.body.orderId;

        res.render('userReview', { productId: productId, orderId });

    } catch (error) {
        console.log(error.message);
    }
}



const addReview = async (req, res) => {

    try {
        const product = await Product.findById(req.body.productId);

        product.reviews.push({
            userId: req.session.users._id,
            reviewText: req.body.review,
            rating: req.body.rating
        });

        await product.save();


        const orderId = req.body.orderId;
        const userId = req.session.users._id;

        const order = await Order.findById(orderId).populate('userId').populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Iterate over each product in the order
        for (let i = 0; i < order.products.length; i++) {
            const product = order.products[i];

            // Check if the product has reviews
            if (product.productId.reviews.length > 0) {
                // Iterate over each review of the product
                for (let j = 0; j < product.productId.reviews.length; j++) {
                    const review = product.productId.reviews[j];


                    if (review.userId.toString() === userId.toString()) {

                        product.hasReviewed = true;
                        break;
                    }
                }
            } else {

                product.hasReviewed = false;
            }
        }

        res.render('view-Order', { order,orderId });
    } catch (error) {
        console.error('Error saving review:', error);

    }
}


const loadContact = async(req,res)=>{
    try {
        res.render('contact')
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    loadHome,
    verifyLogin,
    forgetLoad,
    verifyOTP,
    sendOTP,
    userProfile,
    blockedBY,
    resendOTP,
    editProfile,
    editUser,
    loadAbout,
    forgetPass,
    verifyOtpForgotPassword,
    resetPassword,
    loadEditAddress,
    editAddress,
    loadChangePassword,
    changePassword,
    loadUserAddAddress,
    userAddAddress,
    viewEveryAddress,
    loadUserAddAddressFromProfile,
    backtoViewAddress,
    deleteAddress,
    loadFeatures,
    userLogout,
    loadWallet,
    addReview,
    loadReview,
    loadContact







}