
const mongoose = require("mongoose");


const bannerSchema = new mongoose.Schema({
    bannerName:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    link:{
        type:String,
        required:true
    },
    is_listed:{
        type:Number,
        default:0
    },
    description:{
        type:String
    }

});


module.exports = mongoose.model('Banner', bannerSchema);

