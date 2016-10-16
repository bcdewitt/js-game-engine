define('GameEngine', function(module) {
	'use strict';

	const TiledMap = require('TiledMap');

	class GameEngine {
		constructor(jsonPath) {
			this.loaded = false;
			this.runAfterLoad = false;
			this.canvas = document.getElementById('game');

			// Set up map
			this.map = new TiledMap(jsonPath, () => {
				this.loaded = true;

				// *call this.run() if an attempt was made before loading was complete
				if(this.runAfterLoad) { this.run(); }
			});
		}

		run() {

			// *If we haven't finished loading, mark a flag to run after load and return
			if(!this.loaded) {
				this.runAfterLoad = true;
				return;
			}

			let main = (timestamp) => {
				window.requestAnimationFrame(main); // This can also return a callback id

				// TODO: Replace this with actual ECS setup
				this.map.renderToCanvas(this.canvas, 'Background', timestamp);
				this.map.renderToCanvas(this.canvas, 'Platforms', timestamp);
			};

			main(performance.now());
		}
	}

	module.exports = GameEngine;
});
