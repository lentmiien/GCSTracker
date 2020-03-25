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

### Database columns

- tracking: type.STRING
  - Tracking number of package, always required
- carrier: type.STRING
  - The tracking service to use: JP / USPS / DHL
- country: type.STRING
  - The destination country according to the tracking information (country of last tracking update)
  - \*If delivered within Japan, set to second last country, and mark record as failed delivery
- addeddate: type.BIGINT
  - Date when added to database, never needs to be updated
- lastchecked: type.BIGINT
  - Last time checked/updated
- status: type.STRING
  - Last tracking status
- shippeddate: type.BIGINT
  - Shipping date (date of first tracking status)
- delivereddate: type.BIGINT
  - Delivered date, should be the date when the package was delivered to the customer, or the same as the shipping date if unknown.
  - \*If set to NULL/0 then the package was not delivered successfully (returned or lost)
  - \*Also set to NULL/0 if currently in progress
- delivered: type.BOOLEAN
  - delivered should be set to 1 when a package has been delivered, determined as lost, or been returned (for returned packages, set to 1 when package arrives at our warehouse)
- data: type.TEXT
  - Acquired tracking data

### Important statuses

1. Currently tracking the package
   - delivereddate == 0
   - delivered == 0
2. Package was delivered to customer
   - delivereddate == timestamp or 1
   - delivered == 1
   - status == "delivered"
3. Package was lost or returned
   - delivereddate == 0
   - delivered == 1
   - status == "lost" or "returned"

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
