# JS Game Engine #

A JavaScript library that utilizes the ECS design pattern to organize video game logic.


## Example ##
* (TBD)


## What is this repository for? ##

* A custom game engine being developed with aspirations to eventually exceed the quality of currently available JS game engines...but is mostly for educational purposes at the moment.
* Version 0.0.1


## How do I get set up? ##

* This will eventually be installable via `npm i --save <project name>`.
* Install node and clone the repository. Run `npm install` at the project root.


## Development guidelines ##

* Set up your IDE to use the ESLint configuration and run `npm run lint` to catch problems early.
* Follow Test Driven Development.
* Tests are in the test/tests folder. Each one uses Puppeteer to run the test in a browser context and looks like this: `const result = await global.page.evaluate(() => { ... }`
* While developing, be sure to build using `npm run build` or `npm run watch` before running tests with `npm run test`.
* Be sure to include valid jsdoc comments on any new classes, methods, mixins, etc. instead of manually running the command each time.
* Before finishing a feature, update the documentation using `npm run doc`.


## Who do I talk to? ##

* Repo owner: [BDawgonnit](https://bitbucket.org/BDawgonnit/)
