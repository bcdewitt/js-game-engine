/**
 * TiledMap module.
 * @module TiledMap
 */
define('TiledMap', function(module) {
	'use strict';

	const AssetUser = require('AssetUser');
	const utilities = require('utilities');

	/** Class representing a Map built from Tiled data. */
	class TiledMap extends AssetUser {
		constructor(data) {
			super();
			this.data = data;
			this.assets = {};

			this.tileWidth = data.tilewidth || 0;
			this.tileHeight = data.tileheight || 0;
			this.tiles = [];
			this.layers = {};
			this.objects = [];
			this.layerCanvases = {};
		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON)
		 */
		getAssetPaths() {
			let paths = [];

			paths.push(this.data.properties.bgm);

			this.data.tilesets.forEach(function(tileset) {
				paths.push(tileset.image);
			});

			return paths;
		}

		/**
		 * Event handler function - Store downloaded assets
		 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()"
		 */
		onAssetsLoaded(assets) {
			this.assets = assets;

			this.bgm = this.data.properties && assets[this.data.properties.bgm];

			// Populate this.tiles array
			this.populateTiles(this.data.tilesets);

			// Split up each layer's data into x and y coordinate multidimensional array
			this.populateLayers(this.data.layers);

			// Draw the non-animated parts of each map layer on stored canvases (speeds up rendering at runtime)
			this.populateLayerCanvases();

			super.onAssetsLoaded();
		}

		getObjects() {
			return this.objects;
		}

		/**
		 * Creates in-memory representations of tiles using given tilesets.
		 * @param  {Object[]} tilesets - Array of plain objects representing tileset data.
		 */
		populateTiles(tilesets) {
			for(let tileset of tilesets) {
				let img = this.assets[tileset.image];

				let yInc = tileset.tileheight + tileset.spacing;
				for(let y = tileset.margin; this.tiles.length < tileset.tilecount; y += yInc) {

					let xInc = tileset.tilewidth + tileset.spacing;
					for(let x = tileset.margin, l = (tileset.columns * tileset.tilewidth); x < l; x += xInc) {
						let obj = {
							img: img,
							x: x,
							y: y,
							width: tileset.tilewidth,
							height: tileset.tileheight
						};
						let extraData = tileset.tiles && tileset.tiles[this.tiles.length];

						if(extraData && extraData.animation) {
							let rangeStart = 0;
							let rangeEnd = 0;
							obj.animation = [];

							for(let step of extraData.animation) {
								rangeStart = rangeEnd;
								rangeEnd = rangeStart + step.duration;
								obj.animation.push({
									rangeStart: rangeStart,
									rangeEnd: rangeEnd,
									tileid: step.tileid
								});
							}
						}

						this.tiles.push(obj);
					}
				}
			}
		}

		/**
		 * Creates in-memory representations of layers and objects using given layers data.
		 * @param  {Object[]} layers - Array of plain objects representing layer data.
		 */
		populateLayers(layers) {
			for(let layer of layers) {
				if(layer.data && layer.type === 'tilelayer') {
					let layerData = utilities.createArray(layer.width, layer.height);
					let idx = 0;

					for(let y = 0, l = layer.height; y < l; y++) {
						for(let x = 0, l2 = layer.width; x < l2; x++) {
							layerData[x][y] = layer.data[idx++];
						}
					}

					this.layers[layer.name] = {
						width: layer.width,
						height: layer.height,
						data: layerData
					};
				} else if (layer.type === 'objectgroup') {
					let objects = layer.objects;
					for(let object of objects) {
						let obj = {
							width: object.width,
							height: object.height,
							x: object.x,
							y: object.y,
							type: object.type,
							name: object.name
						};

						for(let key in object.properties) {
							obj[key] = object.properties[key];
						}

						this.objects.push(obj);
					}
				}
			}
		}

		/**
		 * Creates and draws canvases for each layer in this.layers. Only non-animated tiles are drawn.
		 */
		populateLayerCanvases() {

			for (let layerName in this.layers) {
				let layer = this.layers[layerName];
				let canvas = document.createElement('canvas');
				canvas.width = layer.width * this.tileWidth;
				canvas.height = layer.height * this.tileHeight;
				let context = canvas.getContext('2d');

				if(layer && layer.data) {
					for(let y = 0, l = layer.height; y < l; y++) {
						for(let x = 0, l2 = layer.width; x < l2; x++) {
							let tile = this.tiles[layer.data[x][y] - 1];
							let posX = x * this.tileWidth;
							let posY = y * this.tileHeight;

							if(tile && tile.animation === undefined) {
								context.drawImage(
									tile.img,
									tile.x,
									tile.y,
									tile.width,
									tile.height,
									posX,
									posY,
									this.tileWidth,
									this.tileHeight
								);
							}

						}
					}
				}

				this.layerCanvases[layerName] = canvas;
			}

		}

		/**
		 * Render animated tiles within the given area of a layer (tile frame depends on given time).
		 * @param  {CanvasRenderingContext2D} context - Provides API to draw on a canvas.
		 * @param  {string} layerName                 - Key referencing layer in this.layers.
		 * @param  {DOMHighResTimeStamp} time         - Time in milliseconds since first render.
		 * @param  {number} tileX1                    - x-coordinate at top left in number of tiles from left.
		 * @param  {number} tileY1                    - y-coordinate at top left in number of tiles from left.
		 * @param  {number} tileX2                    - x-coordinate at bottom right in number of tiles from left.
		 * @param  {number} tileY2                    - y-coordinate at bottom right in number of tiles from left.
		 * @param  {number} dX                        - x-coordinate at top left of destination in pixels from left.
		 * @param  {number} dY                        - y-coordinate at top left of destination in pixels from left.
		 * @param  {number} scaleW                    - scaling for width.
		 * @param  {number} scaleH                    - scaling for height.
		 */
		renderAnimatedTiles(context, layerName, time, tileX1, tileY1, tileX2, tileY2, dX, dY, scaleW, scaleH) {
			let layer = this.layers[layerName];

			if(layer && layer.data) {
				for(let y = tileY1, l = Math.min(layer.height, tileY2); y < l; y++) {
					for(let x = tileX1, l2 = Math.min(layer.width, tileX2); x < l2; x++) {
						let colData = layer.data[x];
						let tileIdx = colData && colData[y];
						let tile = tileIdx && this.tiles[tileIdx - 1];
						let posX = (x * this.tileWidth) + dX;
						let posY = (y * this.tileHeight) + dY;

						if(tile && tile.animation) {
							let wrappedTime = time % tile.animation[tile.animation.length - 1].rangeEnd;
							for(let step of tile.animation) {
								if(wrappedTime > step.rangeStart && wrappedTime < step.rangeEnd) {
									tile = this.tiles[step.tileid];
								}
							}

							context.drawImage(
								tile.img,
								tile.x,
								tile.y,
								tile.width,
								tile.height,
								posX,
								posY,
								this.tileWidth * scaleW,
								this.tileHeight * scaleH
							);

						}
					}
				}
			}

		}

		/**
		 * Render given area of a layer.
		 * @param  {CanvasRenderingContext2D} context - Provides API to draw on a canvas.
		 * @param  {string} layerName                 - Key referencing layer in this.layers.
		 * @param  {DOMHighResTimeStamp} timestamp    - Current time in milliseconds.
		 * @param  {number} sX                        - x-coordinate at top left of source in pixels from left.
		 * @param  {number} sY                        - y-coordinate at top left of source in pixels from left.
		 * @param  {number} sW                        - width of source in pixels.
		 * @param  {number} sH                        - height of source in pixels.
		 * @param  {number} dX                        - x-coordinate at top left of destination in pixels from left.
		 * @param  {number} dY                        - y-coordinate at top left of destination in pixels from left.
		 * @param  {number} dW                        - width of destination in pixels.
		 * @param  {number} dH                        - height of destination in pixels.
		 */
		render(context, layerName, timestamp, sX, sY, sW, sH, dX, dY, dW, dH) {
			// Note: May need to use context.getImageData() and .putImageData() for transparency support instead of .drawImage()
			// ...I tried these but they created memory leaks when debugging with Chrome

			this.startTime = this.startTime || timestamp;

			let canvas = this.layerCanvases[layerName];

			if(canvas) {

				// Draw static parts of layer
				context.drawImage(canvas, sX, sY, sW, sH, dX, dY, dW, dH);

				// Draw animated parts of layer
				this.renderAnimatedTiles(
					context,
					layerName,
					(timestamp - this.startTime),         // get time since first render (for animation)
					parseInt(sX / this.tileWidth),        // calc x1 in tile units
					parseInt(sY / this.tileHeight),       // calc y1 in tile units
					parseInt(sX + sW) / this.tileWidth,   // calc x2 in tile units
					parseInt(sY + sH) / this.tileHeight,  // calc y2 in tile units
					dX, dY, dW / sW, dH / sH              // destination x, y, scaling-x, scaling-y
				);

			}

		}
	}

	module.exports = TiledMap;

});
