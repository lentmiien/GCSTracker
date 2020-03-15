# Shipping tracker

An application for tracking shipments through Japan Post and DHL. Japan Post tracking is done through web scraping, and DHL tracking is done through API requests.

To come: USPS API tracking...

## Details

1. Login using passport
2. Has

   - an index route that can be accessed by anyone
   - a login route that requires you to be logged out
   - a mypage route that requires you to be logged in
   - an API interface, you either need an API key or to be logged in

3. Uses bootstrap styling and javascript
4. Uses D3 library for plotting graphs

## Startup

1. Download git file and extract to an empty folder
2. Open folder in terminal and run "npm install"
3. Create ".env" based on ".env_sample"
4. Start server by running "npm start"
5. Access "localhost:5000" in browser

## Datebase

This application uses a MySQL database.

## API

This application has 2 API access points.

1. "/mypage/api/add"

   - Accept POST requests for adding new records to database

2. "/mypage/api/get/start_date/end_date"
   - Accepts GET requests for acquiring data from database
   - Only returns records updated between start_date and end_date

Both API points require an API key, set in the HTML header [api-key: xxx], or if you are a logged in user, you can use the API without an API key.

## Analyse functions

1. Dashboard
   - Average shipping times (DHL, EMS, Other)
   - Status on how many records that has been tracked, and status code of each tracking interface
   - See all "delayed" packages (delayed = has been checked but has not yet arrived)
2. Delivered page
   - See all delivered packages, including delivery time
3. Status page
   - All tracking updates
4. Country page
   - Average shipping times (DHL, EMS, Other)
   - Total number of packages and number of delivered packages
   - Delivery time graph
