# JS Game Engine #

A JavaScript library that utilizes the ECS design pattern to organize video game logic. This has been mostly used for educational purposes (learning ES6+ syntax, Rollup, JSDoc, Jest, etc.), but I do aim to eventually complete this and build a real game with it.


## How do I get set up? ##

Until this is complete enough for me to put up on npm, I would install the example game instead of the engine alone. The example game includes this engine and shows it being put to use in an incomplete but functional prototype.


## Development guidelines ##

I am not currently accepting outside contributions, but will list out the guidelines I use for this project:

* Set up your IDE to use the ESLint configuration and run `npm run lint` to catch problems early.
* Follow Test Driven Development - make a failing test first, then implement changes.
* Tests are in the test/tests folder. Each one uses Puppeteer to run the test in a browser context and looks like this: `const result = await global.page.evaluate(() => { ... }`
* While developing, be sure to build using `npm run build` or `npm run watch` before running tests with `npm run test`.
* Be sure to include valid jsdoc comments on any new classes, methods, mixins, etc.
* Before finishing a feature, update the documentation using `npm run doc`.


## Who do I talk to? ##

* Repo owner: [BDawgonnit](https://bitbucket.org/BDawgonnit/)
