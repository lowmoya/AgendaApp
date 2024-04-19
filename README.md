# How To Use

1. Local Database
    i. Prerequisite
        a. Have Docker installed.
    ii. First time set up
        a. Clone this repository.
    iii. Starting the server
        a. Enter the downloaded folder in a terminal
        b. Run `docker-compose up -d`
    iv. Stopping the server
        a. Enter the downloaded folder in a terminal
        b. Run `docker-compose down`
    v. Release mode
        a. To enable release mode (uses static files rather than reloading them
           each time) enable the `WA_RELEASE` flag in the `docker-compose.yml`
           file, under the server service.


2. Testing Online Database
    i. Prerequisite
       a. Have NodeJS installed.
       b. Have NPM installed.
    ii.	First time set up
        a. Clone this repository.
        b. Enter the downloaded folder in a terminal.
        c. Run `npm i` to download the mongodb library for node.
    iii. Starting the server
        a. Run `node server/index.js` in a terminal that's inside the
           main folder of the downloaded repository.
    iv. Stopping the server
        a. Hit Control+C in the terminal that the server is running in.
