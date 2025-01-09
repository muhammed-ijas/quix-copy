const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    },
    orderedDate: {
        type: Date,
        default: Date.now
    },
    couponAmount:{
        type: Number,
        default:0
    },
    couponMinimumSpend:{
        type:Number,
        default:0
    },
    paymentMethod: {
        type: String,
        required: true
    },
    shippingAddress: {
        country: {
            type: String,
            required: true
        },
        houseName: {
            type: String,
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
        mobile: {
            type: Number,
            required: true
        },
        pinCode: {
            type: Number,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                default: 'pending'
            },
            reason: {
                type: String,

            },
            deliveryDate: {
                type: Date
            },
            refundAmount: {
                type: Number,
            },
            unitPrice: {
                type: Number,
            },
            orderedAmountWallet:{
                type: Number,
            }





        }
    ],




})


module.exports = mongoose.model('order', orderSchema);

