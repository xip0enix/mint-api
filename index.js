const PORT = process.env.PORT|| 7000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const app = express()

const articles = []

app.get('/', (req, res) => {
    res.json('Welcome to my MINT-EC API')
})

app.get('/api/veranstaltungen', (req, res) => {
    axios.get('https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/')
    .then((response) => {
        const html = response.data
        const $ = cheerio.load(html)

        $('.event-group a').each(function () {
            const eventAccommodation = $(this).find('.event-accommodation').text()
            const eventName = $(this).find('.event-name').text()
            const eventDate = $(this).find('.date-range').text() + $(this).find('.month').text()
            const url = $(this).attr('href')
            articles.push({
                title: eventName,
                eventDate,
                eventAccommodation,
                url
            })
        })
        res.json(articles)
    }).catch((err) => console.log(err))
})

app.listen(PORT, () => console.log(`server running on PORT: ${PORT}`))
