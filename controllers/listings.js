const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    let query = {};
    if (req.query.q && req.query.q.trim() !== "") {
        const regex = new RegExp(req.query.q.trim(), "i");
        query = { $or: [{ title: regex }, { location: regex }, { country: regex }] };
    }
    const allListings = await Listing.find(query);
    res.render("listings/index", { allListings, searchQuery: req.query.q || "" });
  };
  module.exports.renderNewForm =(req, res) => {
  res.render("listings/new.ejs");
}
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({"path": "reviews", populate: { path: "author" }}).populate("owner");
    if(!listing){
      req.flash("error","Listing not found!");
      return res.redirect("/listings");
    }
    console.log(listing);
    // Fetch current user's wishlist so the Save button shows correct state
    let wishlistIds = [];
    if (req.user) {
        const User = require("../models/user");
        const currentUser = await User.findById(req.user._id).select("wishlist");
        wishlistIds = currentUser.wishlist.map(id => id.toString());
    }
    res.render("listings/show.ejs", { listing, wishlistIds });
  } 

module.exports.createListing = async (req, res, next) => {
  let response =await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send()
  let url =req.file.path;
  let filename = req.file.filename;
    // let (title,description,Image,privateDecrypt,location,country)=req.body;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url,filename};
    if (response.body.features.length === 0) {
    req.flash("error", "Invalid location.");
    return res.redirect("/listings/new");
}
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success","New listing created!");
    res.redirect("/listings");
  }
  module.exports.renderEditForm = async (req, res) => {
      let { id } = req.params;
      const listing = await Listing.findById(id);
      if(!listing){
        req.flash("error","Listing not found!");
        return res.redirect("/listings");
      }
      let originalImageUrl = listing.image.url;
      originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250")
      res.render("listings/edit.ejs", { listing , originalImageUrl});
    }
    module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if(typeof req.file !== "undefined"){
    let url =req.file.path;
    let filename = req.file.filename;
    listing.image={url,filename};
    await listing.save();
    }
    
    req.flash("success","Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  }
  module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted successfully!");
    res.redirect("/listings");
    
  }