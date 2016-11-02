// Game's main entry point
(function() {
	'use strict';

	const GameEngine = require('GameEngine');
	const ExampleRenderSystem = require('ExampleRenderSystem');
	const ExampleGameEntityFactory = require('ExampleEntityFactory');

	class Game extends GameEngine {
		addSystems() {
			this.addSystem('render', new ExampleRenderSystem());
			super.addSystems();
		}
	}

	let game = new Game('json/level2.json', new ExampleGameEntityFactory());
	game.run();

	// To test on Xbox: https://msdn.microsoft.com/windows/uwp/xbox-apps/devkit-activation
	// To test on PS4...you need a bunch of steps: https://www.playstation.com/en-us/develop/
	// To test on Wii U/3ds: https://developer.nintendo.com/the-process
})();
