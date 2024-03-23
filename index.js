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

// Set up rate limiter (configurable via environment variables)
const rateLimitWindowMs = process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000; // 1 hour default
const rateLimitMax = process.env.RATE_LIMIT_MAX || 100; // 100 requests default
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: "Too many requests from this IP address, please try again later"
});
app.use(limiter);

// Enable CORS with configurable origins (defaults to all)
const allowedOrigins = process.env.CORS_ORIGINS || '*';
const corsOptions = {
  origin: allowedOrigins,
};
app.use(cors(corsOptions));

// Enable compression middleware
app.use(compression());

// Add Helmet middleware
app.use(helmet());

// Set cache expiration time (configurable via environment variables)
const cacheExpirationTime = process.env.CACHE_EXPIRATION_TIME || 3600; // 1 hour default

// Create a cache object with a TTL value for each entry
const cache = new NodeCache({ stdTTL: cacheExpirationTime });

// Welcome page
app.get("/", (req, res) => {
  res.json("Welcome to my MINT-EC API");
});

// Endpoint for getting event data
async function getEventData() {
  const cacheKey = "veranstaltungen";
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(
      "https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/"
    );

    const $ = cheerio.load(response.data);
    const articles = extractEventData($);

    cache.set(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error("Error fetching event data:", error);
    throw error; // Re-throw for proper error handling
  }
}

app.get("/api/veranstaltungen", async (req, res) => {
  try {
    const articles = await getEventData();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Schedule the task to run every hour
cron.schedule("0 * * * *", async () => {
  try {
    await getEventData();
  } catch (error) {
    console.error("Error in cron job:", error);
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
const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`Server running on port ${port}`));

