const PORT = process.env.PORT || 7000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const cors = require("cors");
const NodeCache = require("node-cache");
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const compression = require('compression');

const app = express();

// Set up rate limiter (maximum 100 requests per hour per IP address)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: "Too many requests from this IP address, please try again later"
});
app.use(limiter);

// Add CORS middleware
app.use(cors());

// Enable compression middleware
app.use(compression());

// Add Helmet middleware
app.use(helmet());

// Set cache expiration time to 1 hour (in seconds)
const CACHE_EXPIRATION_TIME = 3600;

// Create a cache object with a TTL value for each entry
const cache = new NodeCache({ stdTTL: CACHE_EXPIRATION_TIME });

// Welcome page
app.get("/", (req, res) => {
  res.json("Welcome to my MINT-EC API");
});

// Endpoint for getting event data
app.get("/api/veranstaltungen", async (req, res) => {
  try {
    const cacheKey = "veranstaltungen";
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      // If cached data exists, return it
      return res.json(cachedData);
    }

    // If cached data does not exist, fetch data from website
    const response = await axios.get(
      "https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/"
    );

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract event data
    const articles = extractEventData($);

    // Cache the response data with expiration time
    cache.set(cacheKey, articles);

    res.json(articles);
  } catch (error) {
    console.error("Error in /api/veranstaltungen:");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Schedule the task to run every hour
cron.schedule("0 * * * *", async () => {
  try {
    const response = await axios.get(
      "https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/"
    );
    const $ = cheerio.load(response.data);
    const articles = extractEventData($);

    // Cache the response data with expiration time
    cache.set("veranstaltungen", articles);
  } catch (error) {
    console.error("Error in cron job:");
  }
});

// Helper function to extract event data from HTML using cheerio
function extractEventData($) {
  const articles = $(".event-group a").map(function () {
    const eventAccommodation = $(this)
      .find(".event-accommodation")
      .text()
      .trim();
    const eventName = $(this).find(".event-name").text().trim();
    const eventRange = $(this).find(".date-range").text().trim();
    const eventMonth = $(this).find(".month").text().trim();
    const url = $(this).attr("href");

    return {
      title: eventName,
      eventRange,
      eventMonth,
      eventAccommodation,
      url,
    };
  }).get();

  return articles;
}

// Middleware to clear cache on POST requests to this endpoint
app.post("/api/clear-cache", (req, res) => {
  // Clear the cache for the specified key
  const cacheKey = req.body.key;
  cache.del(cacheKey);

  res.json({ message: "Cache cleared successfully" });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
