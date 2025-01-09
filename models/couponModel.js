const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({

    couponCode: {
        type: String,
        require: true,
        unique: true
    },
    couponName: {
        type: String,
        require: true
    },
    discountAmount: {
        type: Number,
        require: true
    },
    minimumSpend: {
        type: Number,
        require: true
    },
    expiryDate: {
        type: Date,
        require: true
    },
    isActive: {
        type: Boolean,
        require: true
    },
    usageLimit: {
        type: Number,
        require: true
    },
    userId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

module.exports = mongoose.model('Coupon',couponSchema);


