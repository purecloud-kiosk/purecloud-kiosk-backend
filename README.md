# PureCloud Kiosk Backend [![Build Status](https://travis-ci.org/purecloud-kiosk/purecloud-kiosk-backend.svg?branch=master)](https://travis-ci.org/purecloud-kiosk/purecloud-kiosk-backend)

PureCloud Kiosk is a service that allows PureCloud users to create and manage check-in events.

## Usage
### Requirements
* [NodeJS](http://nodejs.org/) (with [NPM](https://www.npmjs.org/))
* [MongoDB](http://mongodb.org) (3.2.1 or greater)
* [Redis](http://redis.io)
* [Elasticsearch](https://www.elastic.co/products/elasticsearch) (2.2.0)

### Installation
1. Clone this repo.
2. Install the Node dependencies with `npm install`.
3. Edit the fields in `config.json` (if needed) to configure Mongo, Redis, Elastic, and Amazon AWS. Then start MongoDB and Redis.
4. Start the server with `npm start` or `node server.js`. The server will be launched onto port `8080`.

### API Documentation
Documentation was made with the help of [Swagger](http://swagger.io). A live version of based off of the development branch can be accessed [here](http://charlie-duong.com:8000/api-docs).

### Development
Use `npm run start-dev` during development, it will watch files and relaunch the server whenever a new server is loaded.

For any new packages that need to be installed, be sure to save it into the package.json (for Node Modules)
and bower.json (for Bower Components).

Just install using the `--save` argument when installing. Ex. `npm install --save express` or `bower install --save bootstrap`

### Testing
Tests are written using [Mocha](http://mochajs.org). As development progresses, add tests to the `test` directory. To execute all of the tests, run `npm test`. Be sure to modify the `test_mongo_uri` (if needed) before testing.

## Credits
* [RDash](https://github.com/rdash/rdash-ui)
