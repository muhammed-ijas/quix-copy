


const checkBlockedByAdmin = (req, res, next) => {
    const user = req.session.users; 
  
    if (user && user.is_blocked === 1) {
       
        return res.redirect('/blockedBY');
    }

    
    next();
};

const checkIsAdmin = (req,res,next)=>{
    const admin =req.session.admin;
    
    if(admin){
        next()
        
    }else{
        res.redirect('/admin');

    }
    
};



const isLogin = (req, res, next) => {
    if (req.session.users) {
        next(); 
    } else {
        res.redirect('/login');
    }
};

const isLogout = (req, res, next) => {
    if (req.session.users) {
        res.redirect('/');
    } else {
        next(); 
    }
};







module.exports = {
    checkBlockedByAdmin,
    checkIsAdmin,
    isLogin,
    isLogout
};