const Listing = require("../models/listing");
const CATEGORIES = Listing.CATEGORIES; // single source of truth from the model
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const LIMIT = 8; // listings per page

module.exports.index = async (req, res) => {
    let { q = "", category = "", sort = "", page = "1" } = req.query;
    let query = {};

    // 1. Search filter (existing logic preserved)
    if (q.trim() !== "") {
        const regex = new RegExp(q.trim(), "i");
        query.$or = [{ title: regex }, { location: regex }, { country: regex }];
    }

    // 2. Category filter (new)
    if (category && category !== "All" && CATEGORIES.includes(category)) {
        query.category = category;
    }

    // 3. Sort (new) — using MongoDB .sort()
    let sortObj = {};
    if (sort === "price_asc")  sortObj = { price:  1 };
    else if (sort === "price_desc") sortObj = { price: -1 };
    else if (sort === "newest")     sortObj = { _id:  -1 };

    // 4. Pagination (new) — backend skip/limit
    const pageNum    = Math.max(1, parseInt(page) || 1);
    const totalCount = await Listing.countDocuments(query);
    const totalPages = Math.ceil(totalCount / LIMIT) || 1;
    const safePage   = Math.min(pageNum, totalPages);
    const skip       = (safePage - 1) * LIMIT;

    const allListings = await Listing.find(query).sort(sortObj).skip(skip).limit(LIMIT);

    res.render("listings/index", {
        allListings,
        searchQuery: q,
        category,
        sort,
        page: safePage,
        totalPages,
        totalCount,
        CATEGORIES
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { CATEGORIES });
};

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
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send()
  let url = req.file.path;
  let filename = req.file.filename;
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
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Listing not found!");
      return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl, CATEGORIES });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url,filename};
    await listing.save();
    }
    
    req.flash("success","Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted successfully!");
    res.redirect("/listings");
};