define('TiledMap', function(module) {
	'use strict';
	
	const utilities = require('utilities');
	const assetManager = require('assetManager');
	
	class TiledMap {
		
		constructor(url, onLoadCallback) {
			this.json = {};
			this.tileWidth = 0;
			this.tileHeight = 0;
			this.tiles = [];
			this.layers = {};
			this.hasBGM = false;
			this.bgm;
			
			assetManager.queueDownload(url);
			assetManager.downloadAll(() => {
				this.json = assetManager.getAsset(url);
				
				this.tileWidth = this.json.tilewidth;
				this.tileHeight = this.json.tileheight;
				
				// Load the tileset image files (get url from the map data)
				let tilesets = this.json.tilesets;
				for(let tileset of tilesets) {
					assetManager.queueDownload(tileset.image);
				}
				
				if(this.json.properties.bgm) {
					this.hasBGM = true;
					assetManager.queueDownload(this.json.properties.bgm);
				}
				
				// TODO: Load the image files for spawnable entities (from the map data)
				
				assetManager.downloadAll(() => {
					
					if(this.hasBGM) this.bgm = assetManager.getAsset(this.json.properties.bgm);
					
					// Populate this.tiles array
					let tilesets = this.json.tilesets;
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
					
					// Split up each layer's data into x and y coordinate multidimensional array
					let layers = this.json.layers;
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
					
					onLoadCallback();
				});
			});
		}
		
		renderToCanvas(canvas, layerName, timestamp) {
			this.startTime = this.startTime || timestamp;
			let time = timestamp - this.startTime;
			
			canvas = canvas || document.createElement('canvas');
			
			let context = canvas.getContext('2d');
			let layer = this.layers[layerName];
			
			if(layer && layer.data) {
				for(let y = 0, l = layer.height; y < l; y++) {
					for(let x = 0, l2 = layer.width; x < l2; x++) {
						let tile = this.tiles[layer.data[x][y] - 1];
						let posX = x * this.tileWidth;
						let posY = y * this.tileHeight;
						
						if(tile) {
							if(tile.animation) {
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
							} else {
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
			
			return canvas;
		}
	}
	
	module.exports = TiledMap;
});