// Game's main entry point
(function() {
	'use strict';

	const Engine = require('Engine');
	const RenderSystem = require('RenderSystem');
	const GameEntityFactory = require('GameEntityFactory');

	let engine = new Engine('json/level2.json', new GameEntityFactory(), () => {
		engine.addSystem('render', new RenderSystem(engine.map));
	});
	engine.run();
})();
