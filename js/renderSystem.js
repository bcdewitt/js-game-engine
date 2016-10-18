define('RenderSystem', function(module) {
	'use strict';

	const System = require('System');

	class RenderSystem extends System {
		constructor(getEntities, map) {
			super(getEntities);
			this.canvas = document.getElementById('game');
			this.context = this.canvas.getContext('2d');
			this.map = map;
		}

		forEachEntity(entity) {
			console.log(entity);
		}

		run(timestamp) {
			this.map.render(this.context, 'Background', timestamp, 0, 0, this.canvas.width, this.canvas.height);
			super.run(timestamp);
			this.map.render(this.context, 'Platforms', timestamp, 0, 0, this.canvas.width, this.canvas.height);
		}
	}

	module.exports = RenderSystem;
});
