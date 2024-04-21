# How To Use

1. Local Database
   1. Prerequisite
        1. Have Docker installed.
   2. First time set up
        1. Clone this repository.
   3. Starting the server
        1. Enter the downloaded folder in a terminal
        2. Run `docker-compose up -d`
   4. Stopping the server
        1. Enter the downloaded folder in a terminal
        2. Run `docker-compose down`
   5. Release mode
        1. To enable release mode (uses static files rather than reloading for each request)
           enable the `WA_RELEASE` flag in the `docker-compose.yml`
           file, under the server service.


3. Testing Online Database
   
   Note: As the used database is whitelisted, people outside of this group
   will have to specify a different online database or account in `server/mongo.js`
   file if they would like to run the project in this mode.

   1. Prerequisite
        1. Have NodeJS installed.
        2. Have NPM installed.
   2.	First time set up
        1. Clone this repository.
        2. Enter the downloaded folder in a terminal.
        3. Run `npm i` to download the mongodb library for node.
   3. Starting the server
        1. Run `node server/index.js` in a terminal that's inside the
           main folder of the downloaded repository.
   4. Stopping the server
        1. Hit Control+C in the terminal that the server is running in.
