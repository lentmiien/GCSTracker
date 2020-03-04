# Shipping tracker

An application for tracking shipments through Japan Post and DHL. Japan Post tracking is done through web scraping, and DHL tracking is done through API requests.

## Details

1. Login using passport
2. Has

- an index route that can be accessed by anyone
- a login route that requires you to be logged out
- a mypage route that requires you to be logged in

3. Uses bootstrap styling and javascript

## Startup

1. Download git file and extract to an empty folder
2. Open folder in terminal and run "npm install"
3. Create ".env" based on ".env_sample"
4. Start server by running "npm start"
5. Access "localhost:3000" in browser

## Datebase

This application uses google spreadsheet instead of a database.

## API

This application has 2 API access points.

1. "/mypage/api/add"

- Accept POST requests for adding new records to database

2. "/mypage/api/get"

- Accepts GET requests for acquiring data from database

Both API points require an API key, set in the HTML header [api-key: xxx]
