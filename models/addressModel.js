const mongoose = require("mongoose");


const addressSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Reference to User model
    },
    fullName: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
    },
    houseName:{
      type: String,
    },
    country: {
      type: String,
    },
    pincode: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
  });


  module.exports = mongoose.model('address', addressSchema);