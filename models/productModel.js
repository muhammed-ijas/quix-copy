const mongoose = require("mongoose");


const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required :true
    },
    description:{
        type:String,
        
    },
    prize:{
        type:Number,
        required :true
    },
    images:{
        type: [String],  
        required: true
    },
    categoryName:{
        type:String,
       required:true
    },
    stock:{
        type:Number,
        required:true
    },
    is_listed:{
        type:Number,
        default:0
    },
    offerName:{
        type:String, 
    },
    offerPrice:{
        type:Number
    },
    offerPercentage:{
        type:Number
    },
    reviews:{
        type: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assuming reviews are associated with users
            reviewText: String,
            rating: Number
        }]
    }
    
})



module.exports = mongoose.model('Product',productSchema)