const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required :true
    },
    email:{
        type:String,
        unique: true,
        required :true
    },
    phone:{
        type:String,
        required :true
    },
    password:{
        type:String,
        required :true
    },
    is_admin:{
        type:Number,
       
    },
    is_verified:{
        type:Boolean,
        default:false
    },
    is_blocked:{
        type:Number,
        default:0
    },
    resetPasswordOTP:{
        type: String,
    } ,
    resetPasswordOTPExpiration: {
        type:Date
    },
    walletAmount:{
        type:Number,
        default:0
    },
   
    referralCode:{
        type:String,
    },
    referredFrom:{
        type:String
    }
});



module.exports = mongoose.model('User',userSchema)