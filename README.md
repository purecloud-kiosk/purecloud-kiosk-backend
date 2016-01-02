# PureCloud Kiosk

PureCloud Kiosk is a service that allows PureCloud users to create and manage check-in events.

## Usage
### Requirements
* [NodeJS](http://nodejs.org/) (with [NPM](https://www.npmjs.org/))
* [Bower](http://bower.io)
* [Gulp](http://gulpjs.com)
* [MongoDB](http://mongodb.org)
* [Redis](http://redis.io)

### Installation
1. Clone this repo.
2. Install the Node dependencies with `sudo npm install`.
3. In the dashboard-src directory, install the Bower dependencies with  `bower install`.
4. In root directory, run the gulp build task with `gulp build`.
5. Edit the `production_mongo_uri`, the `redis_host`, and `redis_port` in `config.json` (if needed). Then start MongoDB and Redis.
6. Start the server with `npm start` or `node server.js`.

### API Documentation
Documentation was made with the help of [Swagger](http://swagger.io). A live version of based off of the development branch can be accessed [here](http://charlie-duong.com:8000/api-docs).

### Development
Continue developing the dashboard further by editing the `dashboard-src` directory. With the `gulp` command, any file changes made will automatically be compiled into the specific location within the `dist` directory.

For any new packages that need to be installed, be sure to save it into the package.json (for Node Modules)
and bower.json (for Bower Components).

Just install using the `--save` argument when installing. Ex. `npm install --save express` or `bower install --save bootstrap`

### Testing
Tests are written using [Mocha](http://mochajs.org). As development progresses, add tests to the `test` directory. To execute all of the tests, run `npm test`. Be sure to modify the `test_mongo_uri` (if needed) before testing.

## Credits
* [RDash](https://github.com/rdash/rdash-ui)
