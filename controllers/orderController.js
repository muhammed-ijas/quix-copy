const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const Coupon = require('../models/couponModel');



const loadCheckout = async (req, res) => {
    try {

        const userId = req.session.users._id;



        const userAddress = await Address.find({ userId });

        const userCart = await Cart.findOne({ userId }).populate('products.productId');


        const invalidProducts = [];
        for (const cartItem of userCart.products) {
            if (cartItem.quantity > cartItem.productId.stock) {
                invalidProducts.push(cartItem);
            }
        }

        if (invalidProducts.length > 0) {
            let alertMessage = "Some products in your cart have quantities exceeding stock limits:\n\n";
            for (const product of invalidProducts) {
                alertMessage += `Product: ${product.productId.productName},\n Stock: ${product.productId.stock}, Quantity: ${product.quantity}\n`;
            }
            alertMessage += "\nPlease adjust your cart.";

            if (userCart) {
                res.render('cart.ejs', { carts: userCart.products, cartId: userCart._id, message: alertMessage });
            } else {

                res.render('cart.ejs', { carts: [], cartId: null });
            }

        }

        const subTotal = req.body.subTotal;
        const coupons = await Coupon.find({
            minimumSpend: { $lte: subTotal }, // minimumSpend is less than or equal to subTotal
            isActive: true, // isActive is true
            usageLimit: { $gt: 0 } // usageLimit is greater than 0
        });

        console.log(coupons, subTotal);

        res.render('checkout', { carts: userCart ? userCart.products : [], cartId: userCart._id, subTotal: subTotal, address: userAddress, coupons: coupons });


    } catch (error) {
        console.log(error.message);
    }
};

const loadConfirmOrder = async (req, res) => {
    try {


        console.log(req.body.paymentMethod);


        const userId = req.session.users._id;
        const userCart = await Cart.findOne({ userId }).populate('products.productId');
        const arAddress = await Address.find({ _id: req.body.addressId });
        const address = arAddress[0];
        const invalidProducts = [];
        const user = await User.findById(userId);

        let couponAmount = 0;

        if (req.body.appliedCouponAmount) {
            couponAmount = req.body.appliedCouponAmount;
        }

        let couponMinimumSpend = 0;

        if (req.body.appliedCouponMinimumSpend) {
            couponMinimumSpend = req.body.appliedCouponMinimumSpend;
        }

        for (const cartProduct of userCart.products) {
            const product = await Product.findById(cartProduct.productId);

            if (product && product.stock >= cartProduct.quantity) {
                
            } else {
                invalidProducts.push(cartProduct);
            }
        }


       


        let subtotal = 0;

        for (let i = 0; i < userCart.products.length; i++) {
            const item = userCart.products[i];
            const price = item.productId.offerPrice || item.productId.prize;
            subtotal += price * item.quantity;
        }

        let total = 0;

        if (req.body.appliedCouponAmount) {
            total = subtotal - req.body.appliedCouponAmount;
        } else {
            total = subtotal;
        }




        //checkout page stock checking

        if (invalidProducts.length > 0) {
           

           
            res.redirect('/toCheckout')
        
        } else if (req.body.paymentMethod == 'Wallet' && user.walletAmount < total) {

            const userAddress = await Address.find({ userId });
            const alertMessage = "Insufficient funds in your wallet. Please add funds or choose another payment method.";
            const coupons = await Coupon.find({
                minimumSpend: { $lte: total },
                isActive: true,
                usageLimit: { $gt: 0 }
            });
            res.render('checkout', { carts: userCart ? userCart.products : [], cartId: userCart._id, subTotal: total, address: userAddress, message: alertMessage,coupons: coupons  });

        } else if (req.body.paymentMethod == 'Wallet' && user.walletAmount >= total) {
            for (const cartProduct of userCart.products) {
                const product = await Product.findById(cartProduct.productId);
    
                if (product && product.stock >= cartProduct.quantity) {
                    product.stock -= cartProduct.quantity;
                    await product.save();
                } 
            }



            const user = await User.findById(userId);
            user.walletAmount -= total;

            await user.save();




            const productsArray = userCart.products.map(product => {
                const unitPrice = product.offerPrice || product.productId.prize;
                return {
                    productId: product.productId._id,
                    quantity: product.quantity,
                    unitPrice: unitPrice,
                    orderedAmountWallet: unitPrice * product.quantity
                };
            });


            const shippingAddress = {
                fullName: address.fullName,
                mobile: address.mobile,
                houseName: address.houseName,
                country: address.country,
                pinCode: address.pincode,
                city: address.city,
                state: address.state
            };






            const order = new Order({
                userId: userId,
                subTotal: total,
                orderedDate: new Date(),
                paymentMethod: req.body.paymentMethod,
                shippingAddress: shippingAddress,
                products: productsArray,
                couponAmount: couponAmount,
                couponMinimumSpend: couponMinimumSpend
            });




            await order.save();


            await Cart.findOneAndDelete({ userId });
            const populatedOrder = await Order.findById(order._id)
                .populate('userId')
                .populate('products.productId');



            res.render('confirmation', { order: populatedOrder });







        } else {

            for (const cartProduct of userCart.products) {
                const product = await Product.findById(cartProduct.productId);
    
                if (product && product.stock >= cartProduct.quantity) {
                    product.stock -= cartProduct.quantity;
                    await product.save();
                } else {
                    invalidProducts.push(cartProduct);
                }
            }



            const productsArray = userCart.products.map(product => {
                const unitPrice = product.offerPrice || product.productId.prize;
                return {
                    productId: product.productId._id,
                    quantity: product.quantity,
                    unitPrice: unitPrice
                };
            });


            const shippingAddress = {
                fullName: address.fullName,
                mobile: address.mobile,
                houseName: address.houseName,
                country: address.country,
                pinCode: address.pincode,
                city: address.city,
                state: address.state
            };

            if (!req.body.paymentMethod) {
                req.body.paymentMethod = 'COD'
            }


            const order = new Order({
                userId: userId,
                subTotal: total,
                orderedDate: new Date(),
                paymentMethod: req.body.paymentMethod,
                shippingAddress: shippingAddress,
                products: productsArray,
                couponAmount: couponAmount,
                couponMinimumSpend: couponMinimumSpend
            });




            await order.save();


            await Cart.findOneAndDelete({ userId });
            const populatedOrder = await Order.findById(order._id)
                .populate('userId')
                .populate('products.productId');



            res.render('confirmation', { order: populatedOrder });



        }











    } catch (error) {
        console.log(error.message);
    }
};



const loadviewOrder = async (req, res) => {
    try {

        const userId = req.session.users._id;

        const userOrder = await Order.find({ userId }).populate('userId').populate('products.productId');


        res.render('viewOrders', { order: userOrder });

    } catch (error) {
        console.log(error.message);
    }
}

const loadViewSingleOrder = async (req, res) => {
    try {
      
            const orderId = req.params.orderId;
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
                        
                        // Check if the userId of the review matches the current user's userId
                        if (review.userId.toString() === userId.toString()) {
                            // User has already reviewed this product
                            product.hasReviewed = true;
                            break;
                        }
                    }
                } else {
                    // If the product has no reviews, set hasReviewed to false
                    product.hasReviewed = false;
                }
            }
        
            res.render('view-Order', { order ,orderId});
        
        } catch (error) {
            console.log(error.message);
        }

}


const userCancelOrder = async (req, res) => {
    try {
        const { orderId, productId, userId } = req.body;

        const order = await Order.findById(orderId).populate('products.productId');

        const productIndex = order.products.findIndex(product => product.productId._id.toString() === productId);

        const cancelledProduct = order.products[productIndex];
        const cancelledProductPrice = cancelledProduct.quantity * cancelledProduct.unitPrice;

        order.products[productIndex].status = "cancelled";
        const user = await User.findById(userId);



        if (order.paymentMethod == 'Online Payment' || order.paymentMethod == 'Wallet') {

            if (order.couponAmount > 0) {
                let originalSubTotal = 0;

                order.products.forEach(product => {
                    const totalAmountForProduct = product.quantity * product.unitPrice;
                    originalSubTotal += totalAmountForProduct;
                });

                const newSubTotal = originalSubTotal - cancelledProductPrice;
                if (newSubTotal >= order.couponMinimumSpend) {
                    order.subTotal = newSubTotal - order.couponAmount;
                    order.products[productIndex].refundAmount = cancelledProductPrice;
                    user.walletAmount += cancelledProductPrice;
                    await user.save();
                    await order.save();


                    const updatedOrder = await Order.findById(orderId).populate('products.productId');

                    if(updatedOrder.subTotal < 0 ){
                        updatedOrder.subTotal=0;
                       await  updatedOrder.save()
                    }

                    res.json({ subTotal: updatedOrder.subTotal });
                } else {
                    order.products[productIndex].refundAmount = order.subTotal - newSubTotal;
                    user.walletAmount += order.subTotal - newSubTotal;
                    order.subTotal = newSubTotal;
                    await user.save();
                    await order.save();


                    const updatedOrder = await Order.findById(orderId).populate('products.productId');

                    if(updatedOrder.subTotal < 0 ){
                        updatedOrder.subTotal=0;
                       await  updatedOrder.save()
                    }

                    res.json({ subTotal: updatedOrder.subTotal });



                }

            } else {

                order.products[productIndex].refundAmount = cancelledProductPrice;
                user.walletAmount += cancelledProductPrice;
                await user.save();
                order.subTotal -= cancelledProductPrice;


                await order.save();
    
              
                const updatedOrder = await Order.findById(orderId).populate('products.productId');

                if(updatedOrder.subTotal < 0 ){
                    updatedOrder.subTotal=0;
                   await  updatedOrder.save()
                }
    
                res.json({ subTotal: updatedOrder.subTotal });

            }



        } else {

            if (order.couponAmount > 0) {
                let originalSubTotal = 0;

                order.products.forEach(product => {
                    const totalAmountForProduct = product.quantity * product.unitPrice;
                    originalSubTotal += totalAmountForProduct;
                });

                const newSubTotal = originalSubTotal - cancelledProductPrice;
                if (newSubTotal >= order.couponMinimumSpend) {
                    order.subTotal = newSubTotal - order.couponAmount;
                    
                    
                    
                    await order.save();


                    const updatedOrder = await Order.findById(orderId).populate('products.productId');

                    if(updatedOrder.subTotal < 0 ){
                        updatedOrder.subTotal=0;
                       await  updatedOrder.save()
                    }

                    res.json({ subTotal: updatedOrder.subTotal });
                } else {
                    
                    order.subTotal = newSubTotal;
                   
                    await order.save();


                    const updatedOrder = await Order.findById(orderId).populate('products.productId');

                    if(updatedOrder.subTotal < 0 ){
                        updatedOrder.subTotal=0;
                       await  updatedOrder.save()
                    }

                    res.json({ subTotal: updatedOrder.subTotal });



                }

            } else {

              
                order.subTotal -= cancelledProductPrice;


                await order.save();
    
              
                const updatedOrder = await Order.findById(orderId).populate('products.productId');

                if(updatedOrder.subTotal < 0 ){
                    updatedOrder.subTotal=0;
                   await  updatedOrder.save()
                }
    
                res.json({ subTotal: updatedOrder.subTotal });

            }

            

        }



    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel product' });
    }
};



//adminside

const adminLoadOrder = async (req, res) => {
    try {

        const orders = await Order.find({})

        res.render('adminOrders', { orders: orders })
    } catch (error) {
        console.log(error.message);
    }
}


const adminViewSingleOrder = async (req, res) => {
    try {

        const orderId = req.body.orderId;



        const order = await Order.findById(orderId).populate('userId').populate('products.productId');
        res.render('adminManageOrder', { order: order })

    } catch (error) {
        console.log(error.message);
    }
}

const updateOrderStatus = async (req, res) => {

    const { orderId, productId } = req.params;
    const { status } = req.body;



    try {
        let updateFields = { 'products.$.status': status };

        if (status === 'delivered') {
            updateFields['products.$.deliveryDate'] = new Date();
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId },
            { $set: updateFields },
            { new: true }
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error updating order status' });
    }
};





const userReturnOrder = async (req, res) => {
    try {
        const { orderId, productId, userId, reason } = req.body;
        const order = await Order.findById(orderId).populate('products.productId');
        const productIndex = order.products.findIndex(product => product.productId._id.toString() === productId);

        const returnedProduct = order.products[productIndex];
        const returnedProductPrice = returnedProduct.quantity * returnedProduct.unitPrice;

        order.products[productIndex].status = "returned";
        order.products[productIndex].reason = reason;

        const user = await User.findById(userId);

        if (order.couponAmount > 0) {
            let originalSubTotal = 0;

            order.products.forEach(product => {
                const totalAmountForProduct = product.quantity * product.unitPrice;
                originalSubTotal += totalAmountForProduct;
            });

            const newSubTotal = originalSubTotal - returnedProductPrice;
            if (newSubTotal >= order.couponMinimumSpend) {
                order.subTotal = newSubTotal - order.couponAmount;
                order.products[productIndex].refundAmount = returnedProductPrice;
                user.walletAmount += returnedProductPrice;
                await user.save();
                await order.save();


                const updatedOrder = await Order.findById(orderId).populate('products.productId');

                res.json({ subTotal: updatedOrder.subTotal });
            } else {
                order.products[productIndex].refundAmount = order.subTotal - newSubTotal;
                user.walletAmount += order.subTotal - newSubTotal;
                order.subTotal = newSubTotal;
                await user.save();
                await order.save();


                const updatedOrder = await Order.findById(orderId).populate('products.productId');

                res.json({ subTotal: updatedOrder.subTotal });



            }

        } else {

            order.products[productIndex].refundAmount = returnedProductPrice;
            user.walletAmount += returnedProductPrice;
            await user.save();
            order.subTotal -= returnedProductPrice;


            await order.save();

          
            const updatedOrder = await Order.findById(orderId).populate('products.productId');

            res.json({ subTotal: updatedOrder.subTotal });

        }



    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to cancel product' });
    }
}



const profitShowingGraphOfMonths = async (req, res) => {
    try {

        const orders = await Order.find({}, { subTotal: 1, orderedDate: 1 }).sort({ orderedDate: 1 });

        const labels = orders.map(order => order.orderedDate.toLocaleString('default', { month: 'short' })); // Month abbreviations
        const profits = orders.map(order => order.subTotal);

        res.json({ labels, profits });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const getProductStatusCounts = async (req, res) => {
    try {
        // Count the number of orders for each status
        const deliveredCount = await Order.countDocuments({ 'products.status': 'delivered' });
        const shippedCount = await Order.countDocuments({ 'products.status': 'shipped' });
        const pendingCount = await Order.countDocuments({ 'products.status': 'pending' });
        const cancelledCount = await Order.countDocuments({ 'products.status': 'cancelled' });
        const returnedCount = await Order.countDocuments({ 'products.status': 'returned' });

        // Send the counts as a JSON response
        res.json({
            deliveredCount,
            shippedCount,
            pendingCount,
            cancelledCount,
            returnedCount
        });
    } catch (error) {
        console.error("Error fetching product status counts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



module.exports = {
    loadCheckout,
    loadConfirmOrder,
    loadviewOrder,
    loadViewSingleOrder,
    adminLoadOrder,
    adminViewSingleOrder,
    updateOrderStatus,
    userCancelOrder,
    userReturnOrder,
    profitShowingGraphOfMonths,
    getProductStatusCounts

}



