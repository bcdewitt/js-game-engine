define('TiledMap', function(module) {
	'use strict';

	const utilities = require('utilities');
	const assetManager = require('assetManager');

	class TiledMap {

		// Load methods
		constructor(url, onLoadCallback) {
			this.json = {};
			this.tileWidth = 0;
			this.tileHeight = 0;
			this.tiles = [];
			this.layers = utilities.createIterableObject();
			this.layerCanvases = utilities.createIterableObject();
			this.hasBGM = false;
			this.bgm;

			assetManager.queueDownload(url);
			assetManager.downloadAll(() => {
				this.json = assetManager.getAsset(url);

				this.tileWidth = this.json.tilewidth;
				this.tileHeight = this.json.tileheight;

				this.queueMapFiles(assetManager);

				// Download queued files, finish initializing
				assetManager.downloadAll(() => {

					if(this.hasBGM) this.bgm = assetManager.getAsset(this.json.properties.bgm);

					// Populate this.tiles array
					this.populateTiles(this.json.tilesets);

					// Split up each layer's data into x and y coordinate multidimensional array
					this.populateLayers(this.json.layers);

					// Draw the non-animated parts of each map layer on stored canvases (speeds up rendering at runtime)
					this.populateLayerCanvases();

					onLoadCallback();
				});
			});
		}

		queueMapFiles() {
			// Queue the tileset image files (get url from the map data)
			let tilesets = this.json.tilesets;
			for(let tileset of tilesets) {
				assetManager.queueDownload(tileset.image);
			}

			// Queue the map's music file
			if(this.json.properties.bgm) {
				this.hasBGM = true;
				assetManager.queueDownload(this.json.properties.bgm);
			}
		}

		populateTiles(tilesets) {
			for(let tileset of tilesets) {
				let img = assetManager.getAsset(tileset.image);

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

		populateLayers(layers) {
			for(let layer of layers) {
				if(layer.data) {
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
				}
			}
		}

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


		// Render methods
		renderAnimatedTiles(context, layerName, time, tileX1, tileY1, tileX2, tileY2) {
			let layer = this.layers[layerName];

			if(layer && layer.data) {
				for(let y = tileY1, l = Math.min(layer.height, tileY2); y < l; y++) {
					for(let x = tileX1, l2 =  Math.min(layer.width, tileX2); x < l2; x++) {
						let tile = this.tiles[layer.data[x][y] - 1];
						let posX = x * this.tileWidth;
						let posY = y * this.tileHeight;

						if(tile && tile.animation) {
							let wrappedTime = time % tile.animation[tile.animation.length - 1].rangeEnd;
							for(let step of tile.animation) {
								if(wrappedTime > step.rangeStart && wrappedTime < step.rangeEnd)
									tile = this.tiles[step.tileid];
							}

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

		}

		render(context, layerName, timestamp, x1, y1, width, height) {
			// Note: May need to use context.getImageData() and .putImageData() for transparency support instead of .drawImage()
			// ...I tried these but they created memory leaks when debugging with Chrome

			this.startTime = this.startTime || timestamp;

			// Draw static parts of layer
			context.drawImage(this.layerCanvases[layerName], x1, y1, width, height, 0, 0, width, height);

			// Draw animated parts of layer
			this.renderAnimatedTiles(
				context,
				layerName,
				(timestamp - this.startTime),    // get time since first render (for animation)
				(x1 / this.tileWidth),           // calc x1 in tile units
				(y1 / this.tileHeight),          // calc y1 in tile units
				(x1 + width) / this.tileWidth,   // calc x2 in tile units
				(y1 + height) / this.tileHeight  // calc y2 in tile units
			);

		}

	}

	module.exports = TiledMap;
});
