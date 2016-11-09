/**
 * ExampleRenderSystem module.
 * @module RenderSystem
 */
define('ExampleRenderSystem', function(module) {
	'use strict';

	const System = require('System');

	/** Class representing a particular type of System used for Rendering. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExampleRenderSystem extends System {

		/**
		 * Create a System used for Rendering.
		 * @param {TiledMap} map - The loaded map.
		 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
		 */
		constructor(map) {
			super();
			this.maxFramerate = 60/1000;
			this.lastUpdate = 0;
			this.canvas = document.getElementById('game');
			this.context = this.canvas && this.canvas.getContext('2d');
			this.map = map;
			this.images = {};
			this.frames = [
				{
					img: 'img/monster.png',
					x: 0,
					y: 0,
					width: 16,
					height: 16
				}
			];
		}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {
				camera: function(entity) {
					return entity.hasComponent('camera');
				},
				sprite: function(entity) {
					return entity.hasComponent('sprite');
				}
			};
		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
		 */
		getAssetPaths() {
			return [
				'img/monster.png'
			];
		}

		/**
		 * Event handler function - Store downloaded assets.
		 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
		 */
		onAssetsLoaded(assets) {
			this.images = assets;
			this.addEntity('Camera', {
				x: 0,
				y: 0,
				width: this.canvas.width / 2,
				height: this.canvas.height,
				mapX: 200,
				mapY: 600,
				mapWidth: this.canvas.width / 2,
				mapHeight: this.canvas.height / 2
			});
			this.addEntity('Camera', {
				x: this.canvas.width / 2,
				y: 0,
				width: this.canvas.width / 2,
				height: this.canvas.height,
				mapX: 100,
				mapY: 920,
				mapWidth: this.canvas.width / 2,
				mapHeight: this.canvas.height / 2
			});
			super.onAssetsLoaded();
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * Renders map (and, in the future, Entity objects with sprite components).
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run(timestamp) {

			// Limit drawing operations to 60 times per second
			if(this.maxFramerate && timestamp - this.lastUpdate < this.maxFramerate) return;

			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			// Get each camera
			let cameraEntities = this.getEntities('camera');
			for(let cameraEntity of cameraEntities) {
				let c = cameraEntity.getComponent('camera');
				let layers = {
					Background: { sprites: [] },
					Platforms:  { sprites: [] }
				};

				// Get entities with a sprite component and add to the appropriate layer for rendering
				let entities = this.getEntities('sprite');
				for(let entity of entities) {
					let sprite = entity.getComponent('sprite');
					let frame = this.frames[sprite.frame];
					let img = this.images[frame.img];
					let obj = {
						img: img,
						x: sprite.x - c.mapX,
						y: sprite.y - c.mapY,
						width: img.width,
						height: img.height
					};

					if(
						obj.x + obj.width > 0 && obj.x < c.mapWidth &&
						obj.y + obj.height > 0 && obj.y < c.mapHeight
					) {
						layers[sprite.layer].sprites.push(obj);
					}
				}

				// Draw each map layer (include all sprites for that layer)
				for(let layerKey in layers) {
					let layer = layers[layerKey];

					this.map.render(this.context, layerKey, timestamp, c.mapX, c.mapY, c.mapWidth, c.mapHeight, c.x, c.y, c.width, c.height);

					// Draw each sprite to a temporary canvas
					if(layer.sprites.length > 0) {
						let tempCanvas = document.createElement('canvas');
						tempCanvas.width = c.mapWidth;
						tempCanvas.height = c.mapHeight;
						let tempCtx = tempCanvas.getContext('2d');
						for(let sprite of layer.sprites) {
							tempCtx.drawImage(sprite.img, sprite.x, sprite.y);
						}

						// Draw the temporary canvas to the main canvas (position and fit to camera bounds)
						this.context.drawImage(tempCanvas, 0, 0, c.mapWidth, c.mapHeight, c.x, c.y, c.width, c.height);
					}
				}
			}
			
			this.lastUpdate = timestamp;

		}
	}

	module.exports = ExampleRenderSystem;
});
