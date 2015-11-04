# PureCloud Kiosk

PureCloud Kiosk is a service that allows users of the PureCloud Ecosystem to create and manage check-in events.

## Usage
### Requirements
* [NodeJS](http://nodejs.org/) (with [NPM](https://www.npmjs.org/))
* [Bower](http://bower.io)
* [Gulp](http://gulpjs.com)

### Installation
1. Clone this repo.
2. Install the Node dependencies: `sudo npm install`.
3. In the dashboard-src directory, install the Bower dependencies:  `bower install`.
4. In root directory, run the gulp build task: `gulp build`.
5. Start the server : 'node server.js'

### Development
Continue developing the dashboard further by editing the `src` directory. With the `gulp` command, any file changes made will automatically be compiled into the specific location within the `dist` directory.

For any new packages that need to be installed, be sure to save it into the package.json (for Node Modules)
with and bower.json (for Bower Components).

Just install using the '--save' argument when installing. Ex. 'sudo npm install express --save'

## Credits
* [RDash Angular](https://github.com/rdash/rdash-angular)
