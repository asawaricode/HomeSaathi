const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

// Single source of truth for categories — used in schema, filters, and forms
const CATEGORIES = [
    "Trending", "Rooms", "Cities", "Mountains", "Castles",
    "Amazing pools", "Camping", "Farms", "Arctic",
    "Domes", "Boats", "Skiing"
];

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        url: String,
        filename: String
    },
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: CATEGORIES,
        default: "Trending"
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// Performance indexes — match actual query patterns used in the index controller
listingSchema.index({ category: 1 });                    // category filter (exact match)
listingSchema.index({ price: 1 });                       // price sort (price_asc / price_desc)
listingSchema.index({ title: 1, location: 1, country: 1 }); // search fields
    

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing){
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
    });



const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
module.exports.CATEGORIES = CATEGORIES;