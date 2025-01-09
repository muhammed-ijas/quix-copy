require('dotenv').config()
const mongoose = require("mongoose");


const mongoURI = process.env.MONGO_URI;
// mongoose.connect("mongodb+srv://muhammedijas793:MpdccfkUTEgcmuIl@quix.ku2tm.mongodb.net/?retryWrites=true&w=majority&appName=quix");

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error("MongoDB connection error:", err));

const express = require("express");
const app = express();
var easyinvoice = require('easyinvoice');

const port  = process.env.PORT || 3000

app.use(express.static('public'))

//for user routes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//for admin routes
const adminRoute = require('./routes/adminRoutes');
app.use('/',adminRoute);



app.listen(port,()=>{
    console.log("server is running .....");
})

