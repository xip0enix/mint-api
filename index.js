const PORT = process.env.PORT || 7000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cache = require("memory-cache");
const cron = require("node-cron");
const cors = require("cors");

const app = express();

// Hier fügen Sie das CORS-Modul als Middleware hinzu.
app.use(cors());

app.get("/", (req, res) => {
  res.json("Welcome to my MINT-EC API");
});

app.get("/api/veranstaltungen", async (req, res) => {
  try {
    const cacheKey = "veranstaltungen";

    // Check if data exists in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await axios.get(
      "https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/"
    );

    const $ = cheerio.load(response.data);

    const articles = $(".event-group a").map(function () {
      const eventAccommodation = $(this)
        .find(".event-accommodation")
        .text();
      const eventName = $(this).find(".event-name").text();
      const eventRange =
        $(this).find(".date-range").text();
      const eventMonth = $(this).find(".month").text();
      const url = $(this).attr("href");

      return {
        title: eventName,
        eventRange,
        eventMonth,
        eventAccommodation,
        url,
      };
    }).get();

    // Cache the response data for 1 hour
    cache.put(cacheKey, articles, 3600000);

    res.json(articles);
  } catch (error) {
    console.error(error);
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

    const articles = $(".event-group a").map(function () {
      const eventAccommodation = $(this)
        .find(".event-accommodation")
        .text();
      const eventName = $(this).find(".event-name").text();
      const eventRange =
        $(this).find(".date-range").text();
      const eventMonth = $(this).find(".month").text();
      const url = $(this).attr("href");

      return {
        title: eventName,
        eventRange,
        eventMonth,
        eventAccommodation,
        url,
      };
    }).get();

    // Cache the response data for 1 hour
    cache.put("veranstaltungen", articles, 3600000);
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => console.log(`server running on PORT: ${PORT}`));
