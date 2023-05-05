const PORT = process.env.PORT || 7000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/", (req, res) => {
  res.json("Welcome to my MINT-EC API");
});

app.get("/api/veranstaltungen", async (req, res) => {
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
      const eventDate =
        $(this).find(".date-range").text() + $(this).find(".month").text();
      const url = $(this).attr("href");

      return {
        title: eventName,
        eventDate,
        eventAccommodation,
        url,
      };
    }).get();

    res.json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`server running on PORT: ${PORT}`));
