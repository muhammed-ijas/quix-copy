const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');



//admin  side loadCategories
const adminLoadCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({});



        res.render('adminCategories', { categories: allCategories });

    } catch (error) {

        console.log(error.message);
    }
}

//for admin , load categories  

const loadAddCategories = async (req, res) => {
    try {
        res.render('adminAddCategory')
    } catch (error) {

    }
}

//admin add category

const adminInsertCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName;

        // Validation: Check if category name is empty or contains only spaces
        if (!categoryName.trim()) {
            return res.render('adminAddCategory', { message: 'Category name cannot be empty or contain only spaces' });
        }

        // Check if categoryName contains at least three alphabetic characters
        if (!/[a-zA-Z]{3,}/.test(categoryName)) {
            return res.render('adminAddCategory', { message: 'Category name must contain at least three alphabetic characters' });
        }

        // Check if categoryName is more than 20 characters
        if (categoryName.length > 20) {
            return res.render('adminAddCategory', { message: 'Category name cannot be longer than 20 characters' });
        }

        // Validation: Check if the category name already exist
        const existingCategory = await Category.findOne({ categoryName: categoryName });
        if (existingCategory) {
            return res.render('adminAddCategory', { message: 'Category name already exists. Choose a different name.' });
        }

        // Create  new category
        const category = new Category({
            categoryName: categoryName,
        });

        await category.save();

        res.render('adminAddCategory', { message: 'Category added successfully.' });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



    const adminupdateCategory = async (req, res) => {
        try {
            const categoryId = req.body.categoryId;
            const category = await Category.findById(categoryId);
           
            
              // Update the is_listed status of associated products
        const products = await Product.find({ categoryName: category.categoryName });
        if (products.length > 0) {
            const updatedIsListedStatus = !category.is_listed ? 1 : 0; 
            await Product.updateMany({ categoryName: category.categoryName }, { $set: { is_listed: updatedIsListedStatus } });
        }
            category.is_listed = !category.is_listed;
        
            await category.save();
            
            res.status(200).json({ isListed: category.is_listed }); 
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'An error occurred while updating the category status' });
        }
    };


    
module.exports = {
    adminLoadCategories,
    loadAddCategories,
    adminInsertCategory,
    adminupdateCategory
};