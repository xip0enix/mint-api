# MINT-EC API

This project uses Express.js to create a web server that scrapes data from the MINT-EC website [https://www.mint-ec.de/angebote/veranstaltungen/kommende-veranstaltungen/].

## Installation

To install the dependencies, run: npm install

## Usage

To start the server, run: nodemon run start

The server will listen on port 7000, or the port specified in the `PORT` environment variable.

### API Endpoint

The API endpoint `/api/veranstaltungen` returns a list of upcoming MINT-EC events. The response is in JSON format and contains the following fields:

- `title` (string): The name of the event.
- `eventRange` (string): The date range of the event.
- `eventMonth` (string): The month of the event.
- `eventAccommodation` (string): The location of the event.
- `url` (string): The URL to the event page on the MINT-EC website.

### Demo Website
https://mint-api.onrender.com/api/veranstaltungen
