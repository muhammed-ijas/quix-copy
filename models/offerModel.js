const mongoose = require("mongoose");


const offerSchema = new mongoose.Schema({

    offerName:{
        type:String,
        required :true
    },
    discountPercentage:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    status:{
        type:String
    }
    
})

module.exports = mongoose.model('Offer',offerSchema);

