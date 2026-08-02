/**
 * One-Time Migration Script
 * Assigns a category to existing listings that do not have one yet.
 *
 * HOW TO RUN (only once):
 *   node init/migrate.js
 *
 * SAFE TO RUN MULTIPLE TIMES:
 *   Only updates listings where the category field does not yet exist in MongoDB.
 *   Does NOT delete or overwrite any other listing data.
 */
if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing  = require("../models/listing");
const CATEGORIES = Listing.CATEGORIES;

const dbUrl = process.env.ATLASDB_URL;

async function connect() {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
}

// Keyword map: category => keywords to search in title/description/location
// Checked in order; first match wins. "Trending" is the default fallback.
const categoryKeywords = {
    "Skiing":        ["ski", "chalet", "slope", "verbier", "aspen"],
    "Mountains":     ["mountain", "alpine", "rocky", "peak", "highland", "hill", "banff", "cabin"],
    "Castles":       ["castle", "fort", "palace", "historic villa", "manor", "brownstone", "historic"],
    "Amazing pools": ["pool", "infinity", "bungalow"],
    "Arctic":        ["arctic", "snow", "igloo", "ice", "cold"],
    "Domes":         ["dome", "bubble"],
    "Boats":         ["boat", "yacht", "houseboat", "canal", "lake", "waterfront"],
    "Camping":       ["treehouse", "eco", "forest", "rustic", "safari", "lodge", "camp"],
    "Farms":         ["farm", "ranch", "rural", "countryside", "cotswold", "barn"],
    "Rooms":         ["loft", "studio", "penthouse", "apartment", "room"],
    "Cities":        ["city", "urban", "downtown", "miami", "tokyo", "dubai", "amsterdam", "boston"],
    "Trending":      []
};

function guessCategory(listing) {
    const text = [
        listing.title || "",
        listing.description || "",
        listing.location || ""
    ].join(" ").toLowerCase();

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (cat === "Trending") continue;
        for (const kw of keywords) {
            if (text.includes(kw)) return cat;
        }
    }
    return "Trending";
}

async function runMigration() {
    await connect();

    const listings = await Listing.find({ category: { $exists: false } });
    console.log("\nFound " + listings.length + " listing(s) without a category.");

    if (listings.length === 0) {
        console.log("Nothing to migrate. All listings already have a category.");
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    for (const listing of listings) {
        const cat = guessCategory(listing);
        await Listing.findByIdAndUpdate(listing._id, { $set: { category: cat } });
        console.log("  OK  \"" + listing.title + "\" => " + cat);
        updated++;
    }

    console.log("\nMigration complete. " + updated + " listing(s) updated.");
    await mongoose.disconnect();
}

runMigration().catch(function(err) {
    console.error("Migration failed:", err);
    process.exit(1);
});
