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

			this.context.mozImageSmoothingEnabled = false;
			this.context.msImageSmoothingEnabled = false;
			this.context.imageSmoothingEnabled = false;

			this.map = map;
			this.images = {};
			this.frames = [
				{
					img: 'img/monster.png',
					x: 0,
					y: 0,
					width: 16,
					height: 16
				}, {
					img: 'img/tank.png',
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
				},
				player: function(entity) {
					return entity.hasComponent('being') && entity.getComponent('being').type === 'Player';
				}
			};
		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
		 */
		getAssetPaths() {
			return [
				'img/monster.png',
				'img/tank.png'
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
				width: this.canvas.width,
				height: this.canvas.height,
				mapX: 300,
				mapY: 820,
				mapWidth: parseInt(this.canvas.width / 8),
				mapHeight: parseInt(this.canvas.height / 8),
				following: null
			});
			/*
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
			*/
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

			let players = this.getEntities('player');

			// Get each camera
			let cameraEntities = this.getEntities('camera');
			for(let cameraEntity of cameraEntities) {
				let c = cameraEntity.getComponent('camera');

				// Set up drawing layers
				let layers = {
					Background: { sprites: [] },
					Platforms:  { sprites: [] },
					Player:     { sprites: [] }
				};

				// Force camera to match followed entity
				if(!c.following && players && players[0]) { c.following = players[0]; }
				if(c.following) {
					let sprite = c.following.getComponent('sprite');
					let frame = this.frames[sprite.frame];
					let img = this.images[frame.img];
					c.mapX = sprite.x + parseInt(img.width / 2) - parseInt(c.mapWidth / 2);
					c.mapY = sprite.y + parseInt(img.height / 2) - parseInt(c.mapHeight / 2);
				}

				// Get entities with a sprite component and add to the appropriate layer for rendering
				let entities = this.getEntities('sprite');
				for(let entity of entities) {
					let sprite = entity.getComponent('sprite');
					let frame = this.frames[sprite.frame];
					let img = this.images[frame.img];

					sprite.width = img.width;
					sprite.height = img.height;

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

					let mapX = parseInt(c.mapX);
					let mapY = parseInt(c.mapY);
					let mapWidth = parseInt(c.mapWidth);
					let mapHeight = parseInt(c.mapHeight);
					let x = parseInt(c.x);
					let y = parseInt(c.y);
					let width = parseInt(c.width);
					let height = parseInt(c.height);

					this.map.render(this.context, layerKey, timestamp, mapX, mapY, mapWidth, mapHeight, x, y, width, height);

					// Draw each sprite to a temporary canvas
					if(layer.sprites.length > 0) {
						let tempCanvas = document.createElement('canvas');
						tempCanvas.width = mapWidth;
						tempCanvas.height = mapHeight;
						let tempCtx = tempCanvas.getContext('2d');
						for(let sprite of layer.sprites) {
							tempCtx.drawImage(sprite.img, parseInt(sprite.x), parseInt(sprite.y));
						}

						// Draw the temporary canvas to the main canvas (position and fit to camera bounds)
						this.context.drawImage(tempCanvas, 0, 0, mapWidth, mapHeight, x, y, width, height);
					}
				}
			}

			this.lastUpdate = timestamp;

		}
	}

	module.exports = ExampleRenderSystem;
});
