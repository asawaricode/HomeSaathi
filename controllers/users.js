const User = require("../models/user");
module.exports.renderSignupForm= (req,res) => {
    res.render("users/signup.ejs");
}
module.exports.signup = async (req,res,next) => {
    try{
const {username,email,password} = req.body;
    const newUser = new User({username,email});
    const registeredUser = await User.register(newUser,password);
    console.log(registeredUser);
    req.login(registeredUser, err => {
        if(err){
            return next(err);
        }
    });
    req.flash("success","Welcome to WanderLust!");
    res.redirect("/listings");
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/user/signup");
    }
    }
    module.exports.renderLoginForm = async (req, res) => {
      res.render("users/login.ejs");
    }
    module.exports.login = (req, res) => {
      req.flash("success", "Welcome back!");
      let redirectUrl = res.locals.redirectUrl || "/listings";
        // delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }
    module.exports.logout = (req, res,next) => {
      req.logout((err) => {
        if (err) {
          return next(err);
        }
      });
      req.flash("success", "Logged out successfully!");
      res.redirect("/listings");
    }

// Wishlist toggle: add if not present, remove if already in wishlist
module.exports.toggleWishlist = async (req, res) => {
    const { listingId } = req.params;
    const user = await User.findById(req.user._id);
    const alreadySaved = user.wishlist.includes(listingId);
    if (alreadySaved) {
        await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: listingId } });
        req.flash("success", "Removed from wishlist.");
    } else {
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: listingId } });
        req.flash("success", "Saved to wishlist!");
    }
    res.redirect(`/listings/${listingId}`);
};

// Show wishlist page
module.exports.showWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("users/wishlist", { wishlist: user.wishlist });
};

// Show profile page
module.exports.showProfile = async (req, res) => {
    const Listing = require("../models/listing");
    const user = await User.findById(req.user._id).populate("wishlist");
    const myListings = await Listing.find({ owner: req.user._id });
    res.render("users/profile", { user, myListings, wishlist: user.wishlist });
};