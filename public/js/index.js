(function () {
'use strict';

/**
 * AssetUser module.
 * @module AssetUser
 */

/**
 * Class that acts as an interface/abstract class for any class requiring assets. Please avoid instantiating directly.
 * @interface
 * */
class AssetUser {

	/**
	 * Create an AssetUser instance (fails unless overridden).
	 */
	constructor() {
		if (this.constructor === AssetUser) {
			throw new Error('Can\'t instantiate AssetUser! (abstract class)')
		}
		this.loaded = false;
		this.processing = false;
	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
	 */
	getAssetPaths() {
		return []
	}

	/**
	 * Event handler function - Store downloaded assets.
	 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
	 */
	onAssetsLoaded() {
		this.loaded = true;
		this.processing = false;
	}
}

/**
 * EntityManager module.
 * @module EntityManager
 */

/** Class representing a collection of entities and logic to run against that collection. */
class EntityManager {

	/**
	 * Create an Entity Manager.
	 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
	 */
	constructor(entityFactory) {
		this.entityFactory = entityFactory;
		this.entities = [];
		this.entitySubsets = {};
	}

	/**
	 * Get an array of Entity instances.
	 * @param  {string=} subsetName - Name of entity subset.
	 * @returns {Entity[]}  Entity instances for this game.
	 */
	getEntities(subsetName) {
		if(!subsetName) { return this.entities }
		return this.entitySubsets[subsetName].entities
	}

	/**
	 * Create a subset of the Entity array for this game.
	 * @param  {string} subsetName - Name of component used to get subset.
	 * @param  {function} mapper - Function to help determine if an Entity should be a part of this subset.
	 */
	addEntitySubset(subsetName, mapper) {
		this.entitySubsets[subsetName] = {
			entities: this.entities.filter(mapper),
			shouldContain: mapper
		};
	}

	/**
	 * Add an Entity.
	 * @param  {string} entityType - Type of Entity to add to this game.
	 * @param {Object} data - Plain object representing the component data.
	 * @returns {Entity}  Entity that was added
	 */
	addEntity(entityType, data) {

		let callback = (entity) => {
			for(let subsetKey in this.entitySubsets) {
				let subset = this.entitySubsets[subsetKey];
				let idx = subset.entities.indexOf(entity);
				if(idx === -1 && subset.shouldContain(entity)) {
					subset.entities.push(entity);
				} else if (idx !== -1 && !subset.shouldContain(entity)) {
					subset.entities.splice(idx, 1);
				}
			}
		};

		let entityToAdd = this.entityFactory.create(
			entityType,
			data,
			callback
		);

		this.entities.push(entityToAdd);

		return this.entities[this.entities.length - 1]
	}

	/**
	 * Remove an Entity.
	 * @param {Entity}  entity - Entity instance to be removed
	 */
	removeEntity(entity) {
		let handle = (list) => {
			let idx = list.indexOf(entity);
			if(idx !== -1) {
				list.splice(idx, 1);
			}
		};

		// Remove from subset arrays
		for(let subsetKey in this.entitySubsets) {
			let subset = this.entitySubsets[subsetKey];
			handle(subset.entities);
		}

		// Remove from main set array
		handle(this.entities);
	}
}

/**
 * AssetManager module.
 * @module AssetManager
 */


// Asset Loader/Manager (http://www.html5rocks.com/en/tutorials/games/assetmanager/)

/** Class that represents a set of file retreival methods. */
class AssetManager {

	/**
	 * Create an Asset Manager.
	 */
	constructor() {
		this.cache = {};
		this.init();
	}

	/**
	 * Reset download queue (and error/success counts).
	 */
	init() {
		this.downloadQueue = [];  // array of path strings or plain objects containing a "path" string and "reviver" function (for JSON)
		this.successCount = 0;    // number of successful downloads (set when downloadAll() method is run)
		this.errorCount = 0;      // number of failed downloads (set when downloadAll() method is run)
	}

	/**
	 * Queue a file for download.
	 * @param  {string|Object}  pathOrObj - File path/url at which the file may be found.
	 * @param  {boolean=}  forceDownload - Setting this to true will add the file even if it is found in the cache.
	 */
	queueDownload(pathOrObj, forceDownload) {
		let path = (typeof pathOrObj === 'object') ?
			pathOrObj.path:
			pathOrObj;

		if(forceDownload || !this.cache[path])
			this.downloadQueue.push(pathOrObj);
	}

	/**
	 * Queue multiple files for download.
	 * @param  {string[]}  paths - File paths/urls at which the files may be found.
	 * @param  {boolean=}  forceDownload - Setting this to true will add the files even if it is found in the cache.
	 */
	queueDownloads(paths, forceDownload) {
		for (let path of paths) {
			this.queueDownload(path, forceDownload);
		}
	}

	/**
	 * Download all queued files.
	 * @param  {function}  downloadCallback - function to be run once all files are downloaded.
	 * @param  {function}  progCallback     - function to be run for each file downloaded.
	 */
	downloadAll(downloadCallback, progCallback) {
		if (this.downloadQueue.length === 0) {
			progCallback && progCallback(1.00);
			downloadCallback();
			return
		}

		let handleDownload = (path, obj, success) => {

			if(success) {
				this.successCount += 1;
				//console.log(path + ' is loaded')
			} else {
				this.errorCount += 1;
				//console.log('Error: Could not load ' + path)
			}

			if (this.isDone()) {
				progCallback && progCallback(1.00);
				this.init();
				this.cache[path] = obj;
				downloadCallback();
			} else {
				this.cache[path] = obj;
				progCallback && progCallback((this.successCount + this.errorCount) / this.downloadQueue.length);
			}
		};

		(() => {
			for (let pathOrObj of this.downloadQueue) {
				let path = (typeof pathOrObj === 'object') ?
					pathOrObj.path:
					pathOrObj;
				let parts = path.split('.');
				let ext = parts[parts.length - 1];
				let asset;
				let loadEventName = 'load';

				switch (ext.toLowerCase()) {

					// Images
					case 'jpg':
					case 'jpeg':
					case 'gif':
					case 'bmp':
					case 'png':
					case 'tif':
					case 'tiff':
						asset = new Image();
						break

					// Audio
					case 'ogg':
					case 'wav':
					case 'mp3':
						(function() {
							let innerPathOrObj = pathOrObj; // This and the outer function were needed to keep the path
							let innerPath = (typeof innerPathOrObj === 'object') ?
								innerPathOrObj.path:
								innerPathOrObj;
							let httpRequest = new XMLHttpRequest();
							httpRequest.open('GET', innerPath, true);
							httpRequest.responseType = 'arraybuffer';

							httpRequest.onreadystatechange = function () {
								if (this.readyState === 4) {
									if (this.status === 200) {
										handleDownload(innerPath, this.response, true);
									} else {
										handleDownload(innerPath, null, false);
									}
								}
							};

							httpRequest.send();
						})();
						continue

					// Video
					case 'm3u8':
					case 'webm':
					case 'mp4':
						asset = document.createElement('video');
						loadEventName = 'canplaythrough';
						break

					// JSON
					case 'json':
						(function() {
							let innerPathOrObj = pathOrObj; // This and the outer function were needed to keep the path
							let innerPath = (typeof innerPathOrObj === 'object') ?
								innerPathOrObj.path:
								innerPathOrObj;
							let httpRequest = new XMLHttpRequest();

							httpRequest.onreadystatechange = function () {
								if (this.readyState === 4) {
									if (this.status === 200) {
										let data = JSON.parse(this.responseText);
										if(innerPathOrObj.reviver) { data = innerPathOrObj.reviver(data); }
										handleDownload(innerPath, data, true);
									} else {
										handleDownload(innerPath, null, false);
									}
								}
							};
							httpRequest.open('GET', innerPath, true);
							httpRequest.send();
						})();
						continue
				}

				asset.addEventListener(loadEventName, function() {
					// Note: getting src this way allows us to use the actual value (vs fully-qualified path)
					handleDownload(this.getAttribute('src'), this, true);
				}, false);
				asset.addEventListener('error', function() {
					handleDownload(this.getAttribute('src'), this, false);
				}, false);
				asset.src = path;
			}
		})();
	}


	/**
	 * Returns true if all files in the current download queue have been downloaded.
	 * @returns {boolean} Returns true if done.
	 */
	isDone() {
		return (this.downloadQueue.length === this.successCount + this.errorCount)
	}

	/**
	 * Gets the previously downloaded file from this AssetManager instance's cache.
	 * @param {string} path - The path to the previously downloaded asset.
	 * @returns {*}  Returns an object representing the previously downloaded asset.
	 */
	getAsset(path) {
		return this.cache[path]
	}

}

/**
 * Utilities module.
 * @module utilities
 */

/** Class that represents a set of shared convenience methods. */
class Utilities {

	/**
	 * Creates an associative array (an Object that may be used in a for...of).
	 * @param  {Object=} obj - Plain-data Object.
	 * @returns {Object}  An iterable object for use in for...of loops.
	 */
	static createIterableObject(obj) {
		obj = obj || {};
		obj[Symbol.iterator] = Array.prototype[Symbol.iterator];
		return obj
	}

	/**
	 * Creates an array of the given dimensions.
	 * @param  {...number} [length=0] - Array dimensions.
	 * @returns {Array}  An array that includes the number of dimensions given at the given lengths.
	 */
	static createArray(length) {
		let arr, i;

		arr = new Array(length || 0);
		i = length;

		if (arguments.length > 1) {
			let args = Array.prototype.slice.call(arguments, 1);
			while(i--) arr[length-1 - i] = this.createArray.apply(this, args);
		}

		return arr
	}
}

/**
 * TiledMap module.
 * @module TiledMap
 */

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
		this.bgmLoopTarget = (data.properties && data.properties.bgmLoopTarget) || 0;
	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON)
	 */
	getAssetPaths() {
		let paths = [];

		if(this.data.properties && this.data.properties.bgm) {
			paths.push(this.data.properties.bgm);
		}

		this.data.tilesets.forEach(function(tileset) {
			paths.push(tileset.image);
		});

		return paths
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
		return this.objects
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
				let layerData = Utilities.createArray(layer.width, layer.height);
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
						type: object.type || layer.name,
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

/**
 * GameEngine module.
 * @module Engine
 */

const assetManager = new AssetManager();

/** Class representing a Game Engine. */
class GameEngine extends AssetUser {

	/**
	 * Create a Game Engine.
	 * @param {string} mapPath - URL to the map JSON data.
	 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
	 */
	constructor(mapPath, entityFactory) {
		super();
		this.mapPath = mapPath;
		this.loadingPhase = 0;
		this.runAfterLoad = false;
		this.systems = {};
		this.entityManager = new EntityManager(entityFactory);

		// Queue downloads for overall game....Should this be somehow combined with the addSystems() logic? I copied and edited this logic from there
		let loop = () => {
			let pathsOrObjs = this.getAssetPaths();
			if(!this.loaded) {
				if(pathsOrObjs.length > 0) {
					assetManager.queueDownloads(pathsOrObjs);
				}
				let paths = pathsOrObjs.map(function(pathOrObj) {
					return pathOrObj.path ? pathOrObj.path : pathOrObj // Ensure each item is a path string
				});

				assetManager.downloadAll(() => {
					let assets = {};
					paths.forEach(function(pathStr) {
						assets[pathStr] = assetManager.getAsset(pathStr);
					});

					this.onAssetsLoaded(assets);

					if(!this.loaded) {
						loop();
						return
					}

					this.addSystems();
				});
			}
		};
		loop();

	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON)
	 */
	getAssetPaths() {
		switch(this.loadingPhase) {
			case 0:
				return [{
					path: this.mapPath,
					reviver: function(data) {
						return new TiledMap(data)
					}
				}]
			case 1:
				return this.map.getAssetPaths()
		}
	}

	/**
	 * Event handler function - Store downloaded assets
	 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()"
	 */
	onAssetsLoaded(assets) {
		let objects;

		switch(this.loadingPhase) {
			case 0:
				this.map = assets[this.mapPath];
				break
			case 1:
				this.map.onAssetsLoaded(assets);

				// Create entities for each object type
				objects = this.map.getObjects();
				for(let object of objects) {
					this.addEntity(object.type, object);
				}

				super.onAssetsLoaded();
				break
		}
		this.loadingPhase++;
	}

	/**
	 * Get an array of Entity instances.
	 * @param  {string=} subsetName - Name of entity subset.
	 * @returns {Entity[]}  Entity instances for this game.
	 */
	getEntities(subsetName) {
		return this.entityManager.getEntities(subsetName)
	}

	/**
	 * Create a subset of the Entity array for this game.
	 * @param  {string} subsetName - Name of component used to get subset.
	 * @param  {function} mapper - Function to help determine if an Entity should be a part of this subset.
	 */
	addEntitySubset(subsetName, mapper) {
		this.entityManager.addEntitySubset(subsetName, mapper);
	}

	/**
	 * Add an Entity.
	 * @param  {string} entityType - Type of Entity to add to this game.
	 * @param {Object} data - Plain object representing the component data.
	 * @returns {Entity}  Entity that was added
	 */
	addEntity(entityType, data) {
		return this.entityManager.addEntity(entityType, data)
	}

	/**
	 * Remove an Entity.
	 * @param {Entity}  entity - Entity instance to be removed
	 */
	removeEntity(entity) {
		this.entityManager.removeEntity(entity);
	}

	/**
	 * Adds a System to this game.
	 * @param {string} systemName - Key to use for the system.
	 * @param {System} system - System to add
	 */
	addSystem(systemName, system) {
		this.systems[systemName] = system;

		let subsets = system.getRequiredSubsets();
		for(let subsetKey in subsets) {
			let mapper = subsets[subsetKey];
			this.addEntitySubset(subsetKey, mapper);
		}

		// Share the same entityManager instance with each system
		system.setEntityManager(this.entityManager);
	}

	/**
	 * Instantiate and add Systems for this game.
	 */
	addSystems() {
		let loop = () => {
			let callbackObjs = [];

			// Queue downloads for each system, keep track of callbacks
			for(let systemKey in this.systems) {
				let system = this.systems[systemKey];
				let pathsOrObjs = system.getAssetPaths();
				if(!system.loaded && !system.processing) {
					if(pathsOrObjs.length > 0) {
						assetManager.queueDownloads(pathsOrObjs);
					}
					callbackObjs.push({
						system: system,
						paths: pathsOrObjs.map(function(pathOrObj) {
							return pathOrObj.path ? pathOrObj.path : pathOrObj // Ensure each item is a path string
						})
					});
				}
			}

			// Download all queued assets, run callbacks (feed requested assets)
			assetManager.downloadAll(() => {
				let systemsLoaded = true;
				for(let callbackObj of callbackObjs) {

					let assets = {};
					callbackObj.paths.forEach(function(pathStr) {
						assets[pathStr] = assetManager.getAsset(pathStr);
					});

					callbackObj.system.onAssetsLoaded(assets);
					systemsLoaded = systemsLoaded && callbackObj.system.loaded;
				}

				// If any system was not loaded, loop again
				if(!systemsLoaded) {
					loop();
					return
				}

				// Otherwise, flag engine as "loaded" and...
				this.loaded = true;

				// *call this.run() if an attempt was made to call this.run() before loading was completed
				if(this.runAfterLoad) { this.run(); }
			});
		};
		loop();
	}

	/**
	 * Fire main loop, which continuously iterates over and runs each System.
	 */
	run() {

		// *If we haven't finished loading, mark a flag to run after load and return
		if(!this.loaded) {
			this.runAfterLoad = true;
			return
		}

		// Define the main loop function
		let main = (timestamp) => {

			// Loop over systems (ECS design pattern)
			for(let systemKey in this.systems) {
				this.systems[systemKey].run(timestamp);
			}

			// Keep loop going by making an asynchronous, recursive call to main loop function
			window.requestAnimationFrame(main);
		};

		// Run main loop function
		main(performance.now());
	}
}

/**
 * System module.
 * @module System
 */

/**
 * Class that acts as an interface/abstract class for a System (the "S" in the ECS design pattern). Please avoid instantiating directly.
 * @interface
 * */
class System extends AssetUser {

	/**
	 * Create a System.
	 */
	constructor() {
		super();
		if (this.constructor === System) {
			throw new Error('Can\'t instantiate System! (abstract class)')
		}
		this.entityManager = null;
	}

	/**
	 * Sets the internal function used to get entities from an external source
	 * @param  {EntityManager} entityManager - Provides an API for an entity collection.
	 */
	setEntityManager(entityManager) {
		this.entityManager = entityManager;
	}

	/**
	 * Wrapper for ._getEntities() function - set using .setEntityGetter() (checks if we correctly set up "getRequiredSubsets()" method)
	 * @param {string} subsetName - Name of entity subset to use.
	 * @returns {Entity[]}  List of entities
	 */
	getEntities(subsetName) {
		if(!subsetName || this.getRequiredSubsets()[subsetName]) {
			return this.entityManager && this.entityManager.getEntities(subsetName)
		}

		throw new Error('You must override .getRequiredSubset() to set up subsets before calling .getEntities(subsetName)')
	}

	/**
	 * Add an Entity.
	 * @param  {string} entityType - Type of Entity to add to this game.
	 * @param {Object} data - Plain object representing the component data.
	 * @returns {Entity}  Entity that was added
	 */
	addEntity(entityType, data) {
		return this.entityManager && this.entityManager.addEntity(entityType, data)
	}

	/**
	 * Remove an Entity.
	 * @param {Entity}  entity - Entity instance to be removed
	 */
	removeEntity(entity) {
		this.entityManager && this.entityManager.removeEntity(entity);
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run() {
		throw new Error('You must override .run(). (abstract method)')
	}
}

/**
 * ExampleSpawnerSystem module.
 * @module ExampleSpawnerSystem
 */


/** Class representing a particular type of System used for creating entities. Not intended to be part of final game engine.
 * @extends System
 */
class ExampleSpawnerSystem extends System {
	constructor() {
		super();
		this.lastUpdate = null;
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {
			spawner: function(entity) {
				return entity.hasComponent('spawner')
			},
			spawned: function(entity) {
				return entity.hasComponent('spawned')
			}
		}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * Renders map (and, in the future, Entity objects with sprite components).
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run(timestamp) {
		this.lastUpdate = this.lastUpdate || timestamp;

		// Get all spawners
		let spawnerEntities = this.getEntities('spawner');

		// Filter to only the spawners that are ready to spawn
		let readySpawners = spawnerEntities.filter((spawnerEntity) => {
			let ready = true;
			let spawnedEntities = this.getEntities('spawned');
			for(let spawnedEntity of spawnedEntities) {
				if(spawnedEntity.getComponent('spawned').spawnerSource === spawnerEntity.getComponent('spawner').name) {
					ready = false;
					break
				}
			}
			return ready
		});

		// Create a new spawned entity for each "ready" spawner
		for(let readySpawner of readySpawners) {
			let spawnerComp = readySpawner.getComponent('spawner');

			this.addEntity(spawnerComp.entityType, {
				x: spawnerComp.x,
				y: spawnerComp.y,
				spawnerSource: spawnerComp.name
			});
		}

	}
}

/**
 * InputManager module.
 * @module InputManager
 */

const keyboardInputs = Symbol();

const wasPressed = Symbol();
const held = Symbol();

class DigitalInput {
	constructor() {
		this[wasPressed] = false;
		this.held = false;
	}

	get held() { return this[held] }
	set held(val) {
		this[held] = val;

		if (val && this[wasPressed]) {
			this[wasPressed] = false;
		}
	}

	get pressed() {
		let held = this.held;
		let pressed = !this[wasPressed] && held;
		this[wasPressed] = held;

		return pressed
	}
}

/* Can probably use something along these lines for analog inputs:
const wasPressed = Symbol()
class AnalogInput {
	constructor() {
		this.value = 0 (may be positive OR negative values)
		this.idleValue = 0
		this.idleThreshold = 20
		this.min = -500
		this.max = 500
		this[wasPressed] = false
	}

	get pressed() {
		let held = this.held
		let pressed = !this[wasPressed] && held
		this[wasPressed] = held

		return pressed
	}

	get held() {
		let idleMin = this.idleValue - this.idleThreshold
		let idleMax = this.idleValue + this.idleThreshold

		return (this.value < idleMin || this.value > idleMax)
	}

	get idle() {
		let idleMin = this.idleValue - this.idleThreshold
		let idleMax = this.idleValue + this.idleThreshold

		return (this.value >= idleMin && this.value <= idleMax)
	}

}
*/

/** Class representing an example input manager. Not intended to be part of final game engine.
 */
class InputManager {
	constructor() {
		this[keyboardInputs] = {
			[32]: new DigitalInput(), // Space Key
			[37]: new DigitalInput(), // Left Arrow
			[39]: new DigitalInput(), // Right Arrow

			[214]: new DigitalInput(), // GamepadLeftThumbstickLeft
			[205]: new DigitalInput(), // GamepadDPadLeft
			[213]: new DigitalInput(), // GamepadLeftThumbstickRight
			[206]: new DigitalInput(), // GamepadDPadRight
			[195]: new DigitalInput()  // A Button
		};

		window.addEventListener('keydown', (event) => {
			let key = this[keyboardInputs][event.keyCode];
			if(key) { key.held = true; }
		}, false);

		window.addEventListener('keyup', (event) => {
			let key = this[keyboardInputs][event.keyCode];
			if(key) { key.held = false; }
		}, false);
	}

	get jumpButton() {
		let key = this[keyboardInputs][195];
		if(key.held) { return key }

		return this[keyboardInputs][32]
	}

	get leftButton() {
		let key = this[keyboardInputs][205];
		if(key.held) { return key }

		key = this[keyboardInputs][214];
		if(key.held) { return key }

		return this[keyboardInputs][37]
	}

	get rightButton() {
		let key = this[keyboardInputs][206];
		if(key.held) { return key }

		key = this[keyboardInputs][213];
		if (key.held) { return key }

		return this[keyboardInputs][39]
	}
}

/**
 * ExampleUpdateSystem module.
 * @module ExampleUpdateSystem
 */

/** Class representing a particular type of System used for updating entities. Not intended to be part of final game engine.
 * @extends System
 */
class ExampleUpdateSystem extends System {
	constructor() {
		super();
		this.lastUpdate = null;
		this.maxUpdateRate = 60 / 1000;
		this.inputManager = new InputManager();
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {
			player: function(entity) {
				return entity.hasComponent('being') && entity.getComponent('being').type === 'Player'
			}
		}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * Renders map (and, in the future, Entity objects with sprite components).
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run(timestamp) {
		this.lastUpdate = this.lastUpdate || timestamp;
		if(this.maxUpdateRate && timestamp - this.lastUpdate < this.maxUpdateRate) return

		let playerEntities = this.getEntities('player');
		for(let playerEntity of playerEntities) {
			let c = playerEntity.getComponent('physicsBody');
			let state = playerEntity.getComponent('state');
			let sprite = playerEntity.getComponent('sprite');

			if(this.inputManager.leftButton.held) {
				c.accX = -0.2;
				state.state = 'driving';
				sprite.flipped = true;
			} else if(this.inputManager.rightButton.held) {
				c.accX = 0.2;
				state.state = 'driving';
				sprite.flipped = false;
			} else {
				c.accX = 0;
				if(c.spdX === 0) state.state = 'idle';
			}

			if(state.state === 'driving') {
				sprite.frame = (parseInt(c.x / 6) % 4) + 1;
			}

			if(this.inputManager.jumpButton.pressed && state.grounded) { c.spdY = -100; }
		}

		this.lastUpdate = timestamp;
	}
}

/**
 * ExamplePhysicsSystem module.
 * @module ExamplePhysicsSystem
 */

const MAX_SPEED_X = 2.2;
const MAX_SPEED_Y = 4.1;
const GRAVITY = 0.3;
const FRICTION = 0.08;

/** Class representing a particular type of System used for applying simple physics to entities. Not intended to be part of final game engine.
 * @extends System
 */
class ExamplePhysicsSystem extends System {
	constructor() {
		super();
		this.lastUpdate = null;
		this.maxUpdateRate = 60 / 1000;
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {
			staticPhysicsBody: function(entity) {
				return entity.hasComponent('staticPhysicsBody')
			},
			physicsBody: function(entity) {
				return entity.hasComponent('physicsBody')
			}
		}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * Renders map (and, in the future, Entity objects with sprite components).
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run(timestamp) {
		this.lastUpdate = this.lastUpdate || timestamp;
		let deltaTime = timestamp - this.lastUpdate;
		if(this.maxUpdateRate && deltaTime < this.maxUpdateRate) return

		let staticEntities = this.getEntities('staticPhysicsBody');
		let nonstaticEntities = this.getEntities('physicsBody');

		// For every nonstatic physics body, check for static physics body collision
		for(let nonstaticEntity of nonstaticEntities) {
			let c = nonstaticEntity.getComponent('physicsBody');
			let state = nonstaticEntity.getComponent('state');
			let wasGrounded = state.grounded;
			state.grounded = false; // Only set to true after a collision is detected

			c.accY = GRAVITY; // Add gravity (limit to 10)

			// Add acceleration to "speed"
			let time = deltaTime / 10;
			c.spdX = c.spdX + (c.accX / time);
			c.spdY = c.spdY + (c.accY / time);

			// Limit speed
			c.spdX = c.spdX >= 0 ? Math.min(c.spdX, MAX_SPEED_X) : Math.max(c.spdX, MAX_SPEED_X * -1);
			c.spdY = c.spdY >= 0 ? Math.min(c.spdY, MAX_SPEED_Y) : Math.max(c.spdY, MAX_SPEED_Y * -1);

			// Use speed to change position
			c.x += c.spdX;
			c.y += c.spdY;

			for(let staticEntity of staticEntities) {
				let c2 = staticEntity.getComponent('staticPhysicsBody');

				let halfWidthSum = c.halfWidth + c2.halfWidth;
				let halfHeightSum = c.halfHeight + c2.halfHeight;
				let deltaX = c2.midPointX - c.midPointX;
				let deltaY = c2.midPointY - c.midPointY;
				let absDeltaX = Math.abs(deltaX);
				let absDeltaY = Math.abs(deltaY);

				// Collision Detection
				if(
					(halfWidthSum > absDeltaX) &&
					(halfHeightSum > absDeltaY)
				) {
					let projectionY = halfHeightSum - absDeltaY; // Value used to correct positioning
					let projectionX = halfWidthSum - absDeltaX;  // Value used to correct positioning

					// Use the lesser of the two projection values
					if(projectionY < projectionX) {
						if(deltaY > 0) projectionY *= -1;
						// alert('move along y axis: ' + projectionY)
						c.y += projectionY; // Apply "projection vector" to rect1
						if(c.spdY > 0 && deltaY > 0) c.spdY = 0;
						if(c.spdY < 0 && deltaY < 0) c.spdY = 0;

						if(projectionY < 0) {
							if(!wasGrounded) { state.groundHit = true; } else { state.groundHit = false; }
							state.grounded = true;
							if(c.spdX > 0) {
								c.spdX = Math.max(c.spdX - (FRICTION / time), 0);
							} else {
								c.spdX = Math.min(c.spdX + (FRICTION / time), 0);
							}
						}
					} else {
						if(deltaX > 0) projectionX *= -1;
						// alert('move along x axis: ' + projectionX)
						c.x += projectionX; // Apply "projection vector" to rect1
						if(c.spdX > 0 && deltaX > 0) c.spdX = 0;
						if(c.spdX < 0 && deltaX < 0) c.spdX = 0;
					}
				}
			}
		}



		this.lastUpdate = timestamp;
	}
}

/**
 * ExampleSoundSystem module.
 * @module ExampleSoundSystem
 */

const _playSound = Symbol('_playSound');
const _time = Symbol('_time');

class TimeOffset {
	constructor(timeStr, millisecondsMode) {
		this[_time] = timeStr;
		this.msMode = millisecondsMode || false;
	}
	valueOf() {
		let val = 0;
		let arr = this[_time].split(':');
		arr.reverse();

		if(arr[3]) { throw Error('Bad TimeOffset string') }
		if(arr[2]) { val += (+arr[2] * 3600000); }
		if(arr[1]) { val += (+arr[1] * 60000); }
		if(arr[0]) { val += (+arr[0] * 1000); }

		if(!this.msMode) return val / 1000

		return val
	}
	toBoolean() {
		return !!this.valueOf()
	}
}

// This is a fix (just in case we only have the webkit prefixed version)
window.AudioContext = window.AudioContext || window.webkitAudioContext;

/** Class representing a particular type of System used for playing sound effects and music. Not intended to be part of final game engine.
 * @param {TiledMap} map - The loaded map.
 */
class ExampleSoundSystem extends System {
	constructor(map) {
		super();
		this.lastUpdate = null;
		this.maxUpdateRate = 60 / 1000;
		this.map = map;
		this.context = new AudioContext();
		this.tracks = {};
		this.bgmPlay = false;
		this.bgmLoopTarget = new TimeOffset(map.bgmLoopTarget);

		this.masterVolume = 1;
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {
			camera: function(entity) {
				return entity.hasComponent('camera')
			},
			sound: function(entity) {
				return entity.hasComponent('sound')
			}
		}
	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
	 */
	getAssetPaths() {
		return [
			'sfx/sfx1.wav'
		]
	}

	/**
	 * Event handler function - Store downloaded assets.
	 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
	 */
	onAssetsLoaded(assets) {
		let callback = () => {
			super.onAssetsLoaded();
		};

		if(this.map.bgm) {
			this.bgmPlay = true;
			assets['bgm'] = this.map.bgm;
		}

		let total = Object.keys(assets).length;

		let count = 0;
		for(let key in assets) {
			let asset = assets[key];

			this.context.decodeAudioData(asset, (decodedData) => {
				this.tracks[key] = decodedData;

				count++;
				if(count >= total) {
					callback();
					return
				}
			});
		}

		this.processing = true; // prevents engine from continuously trying to load assets while we are processing
	}

	[_playSound](src, startAt, loopAt, callback) {
		let sound = this.tracks[src];
		let source = this.context.createBufferSource();

		source.buffer = sound;
		if(callback) { source.onended = callback; }
		let gainNode = this.context.createGain();
		gainNode.gain.value = 1;

		source.connect(gainNode);
		gainNode.connect(this.context.destination);

		if(loopAt) {
			source.loopStart = loopAt % sound.duration;
			source.loopEnd = sound.duration;
			source.loop = !!loopAt;
		}

		source.start(this.context.currentTime + 0.05, startAt || 0); // first param is "time before playing" (in seconds)

		return {
			gainNode: gainNode
		}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * Renders map (and, in the future, Entity objects with sprite components).
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run(timestamp) {
		this.lastUpdate = this.lastUpdate || timestamp;

		if(this.processing) return

		let deltaTime = timestamp - this.lastUpdate;
		if(this.maxUpdateRate && deltaTime < this.maxUpdateRate) return

		if(this.bgmPlay) {
			this.bgmPlay = false;
			this[_playSound]('bgm', 0, this.bgmLoopTarget);
		}

		let soundEntities = this.getEntities('sound');
		for(let soundEntity of soundEntities) {
			let c = soundEntity.getComponent('sound');
			let state = soundEntity.getComponent('state');

			// Sound conditions
			if(soundEntity.hasComponent('being')) {
				let type = soundEntity.getComponent('being').type;
				if(type === 'Player' && state.groundHit) {
					c.src = 'sfx/sfx1.wav';
					c.play = true;
				}
			}

			// Determine distance from soundEntity to cameraCenter
			let distanceToCamCenter = 0;
			let radius = 0;
			let cameraEntities = this.getEntities('camera');
			for(let cameraEntity of cameraEntities) {
				let cam = cameraEntity.getComponent('camera');
				let a = (c.x - cam.mapCenterX);
				let b = (c.y - cam.mapCenterY);
				let currentDist = Math.sqrt((a*a) + (b*b));
				let currentRad = Math.min(cam.mapHalfWidth, cam.mapHalfHeight);

				distanceToCamCenter = !distanceToCamCenter ?
					currentDist :
					Math.min(distanceToCamCenter, currentDist);

				radius = !radius ?
					currentRad :
					Math.min(radius, currentRad);
			}

			// Play
			if(c.play && c.src) {
				c.gainNode = this[_playSound](c.src, 0, 0).gainNode;
				c.play = false;
			}

			// Adjust the sound gain depending on the volume setting and the sound distance...
			if(c.gainNode) {
				if(distanceToCamCenter <= radius) {
					c.gainNode.gain.value = c.volume;
				} else if(distanceToCamCenter - radius >= radius * 2) {
					c.gainNode.gain.value = 0;
				} else {
					let calc = ((distanceToCamCenter - radius) / (radius * 2)) * c.volume;
					c.gainNode.gain.value = calc;
				}
			}

		}

		this.lastUpdate = timestamp;
	}
}

/**
 * ExampleRenderSystem module.
 * @module ExampleRenderSystem
 */

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
				width: 14,
				height: 26
			}, {
				img: 'img/tankSheet.png',
				x: 0,
				y: 0,
				width: 26,
				height: 18
			}, {
				img: 'img/tankSheet.png',
				x: 26,
				y: 0,
				width: 26,
				height: 18
			}, {
				img: 'img/tankSheet.png',
				x: 52,
				y: 0,
				width: 26,
				height: 18
			}, {
				img: 'img/tankSheet.png',
				x: 78,
				y: 0,
				width: 26,
				height: 18
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
				return entity.hasComponent('camera')
			},
			sprite: function(entity) {
				return entity.hasComponent('sprite')
			},
			player: function(entity) {
				return entity.hasComponent('being') && entity.getComponent('being').type === 'Player'
			}
		}
	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
	 */
	getAssetPaths() {
		return [
			'img/monster.png',
			'img/tankSheet.png'
		]
	}

	/**
	 * Event handler function - Store downloaded assets.
	 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
	 */
	onAssetsLoaded(assets) {
		let images = assets; // All assets requested are images...so this is simple

		this.images = images;
		this.flippedImages = {};

		// Images must be flipped and stored in flippedImages under same key
		for(let key in images) {
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d');
			let image = images[key];

			canvas.width = image.width;
			canvas.height = image.height;

			ctx.scale(-1, 1); // flip
			ctx.drawImage(image, (-1 * canvas.width), 0); // draw flipped

			this.flippedImages[key] = canvas;
		}

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
		})
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
		if(this.maxFramerate && timestamp - this.lastUpdate < this.maxFramerate) return

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
				c.mapX = sprite.x + (frame.width / 2) - (c.mapWidth / 2);

				let threshold = (c.mapHeight / 4);
				if(sprite.y < c.mapY + threshold) {
					c.mapY = sprite.y - threshold;
				} else if((sprite.y + sprite.height) > c.mapY + c.mapHeight - threshold) {
					c.mapY = sprite.y + sprite.height - (c.mapHeight - threshold);
				}
			}

			// Get entities with a sprite component and add to the appropriate layer for rendering
			let entities = this.getEntities('sprite');
			for(let entity of entities) {
				let sprite = entity.getComponent('sprite');
				let frame = this.frames[sprite.frame];
				let img = !sprite.flipped ? this.images[frame.img] : this.flippedImages[frame.img];

				sprite.width = frame.width;
				sprite.height = frame.height;

				let obj = {
					img: img,
					x: sprite.x - c.mapX,
					y: sprite.y - c.mapY,
					width: frame.width,
					height: frame.height,
					sx: frame.x,
					sy: frame.y
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

				let mapX = Math.round(c.mapX);
				let mapY = Math.round(c.mapY);
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
						tempCtx.drawImage(sprite.img, parseInt(sprite.sx), parseInt(sprite.sy), parseInt(sprite.width), parseInt(sprite.height), Math.round(sprite.x), Math.round(sprite.y), parseInt(sprite.width), parseInt(sprite.height));
					}

					// Draw the temporary canvas to the main canvas (position and fit to camera bounds)
					this.context.drawImage(tempCanvas, 0, 0, mapWidth, mapHeight, x, y, width, height);
				}
			}
		}

		this.lastUpdate = timestamp;

	}
}

/**
 * Entity module.
 * @module Entity
 */

/** Class that represents an Entity (the "E" in the ECS design pattern). */
class Entity {

	/**
	 * Create an Entity.
	 * @param  {function} compCallback - Function to call after a component is added/removed.
	 */
	constructor(compCallback) {
		this.compCallback = compCallback;
		this.components = {};
	}

	/**
	 * Check if the given component exists for this Entity.
	 * @param  {string} compName - Name of component.
	 * @returns {boolean}  true if the given component exists for this Entity.
	 */
	hasComponent(compName) {
		return this.components[compName] !== undefined
	}

	/**
	 * Gets the component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @returns {Object|null}  Returns the component object under the given name.
	 */
	getComponent(compName) {
		return this.components[compName]
	}

	/**
	 * Adds a component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @param  {Object=} component - Plain-data Object.
	 * @returns {Object|null}  Returns the component object added under the given name.
	 */
	addComponent(compName, component) {
		if(!compName) { return }

		this.components[compName] = component;

		if(this.compCallback) {
			this.compCallback(this);
		}

		return this.components[compName]
	}

	/**
	 * Removes a component object from this Entity under the given name (if it exists).
	 * @param  {string} compName - Name of component.
	 */
	removeComponent(compName) {
		delete this.components[compName];

		if(this.compCallback) {
			this.compCallback(this);
		}
	}
}

/**
 * EntityFactory module.
 * @module EntityFactory
 */

/**
 * Class that acts as an interface/abstract class for an EntityFactory. Please avoid instantiating directly.
 * @interface
 */
class EntityFactory {

	/**
	 * Create an EntityFactory.
	 */
	constructor() {
		if (this.constructor === EntityFactory) {
			throw new Error('Can\'t instantiate EntityFactory! (abstract class)')
		}
	}

	/**
	 * Create an Entity instance of the given type.
	 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
	 * @param {Object} data - Plain object that represents an entity's components.
	 * @param  {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
	 * @returns  {Entity}  A single Entity instance.
	 */
	create(entityType, data, compCallback) {
		if(typeof data !== 'object' || data.constructor !== Object) {
			throw new Error('Can\'t must use plain objects for data')
		}
		return new Entity(compCallback)
	}
}

const _x = Symbol('_x');
const _y = Symbol('_y');
const _width = Symbol('_width');
const _height = Symbol('_height');

class SpriteComponent {
	constructor(x, y, width, height, frame, layer) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.frame = frame;
		this.layer = layer;
		this.flipped = false;
	}
	get x() {
		return this[_x]
	}
	set x(val) {
		this[_x] = val;
		this.midPointX = val + this.halfWidth;
	}

	get y() {
		return this[_y]
	}
	set y(val) {
		this[_y] = val;
		this.midPointY = val + this.halfHeight;
	}

	get width() {
		return this[_width]
	}
	set width(val) {
		this[_width] = val;
		this.halfWidth = val / 2;
		this.midPointX = this.x + this.halfWidth;
	}

	get height() {
		return this[_height]
	}
	set height(val) {
		this[_height] = val;
		this.halfHeight = val / 2;
		this.midPointY = this.y + this.halfHeight;
	}
}

const _entity = Symbol('_x');
const _spriteComp = Symbol('_x');

class SpritePhysicsComponent {
	constructor(entity) {
		this[_entity] = entity;
		this.accX = 0;
		this.accY = 0;
		this.spdX = 0;
		this.spdY = 0;
	}
	get [_spriteComp]() { return this[_entity].getComponent('sprite') }
	get x() { return this[_spriteComp].x }
	set x(val) { this[_spriteComp].x = val; }
	get y() { return this[_spriteComp].y }
	set y(val) { this[_spriteComp].y = val; }
	get width() { return this[_spriteComp].width }
	set width(val) { this[_spriteComp].width = val; }
	get height() { return this[_spriteComp].height }
	set height(val) { this[_spriteComp].height = val; }
	get midPointX() { return this[_spriteComp].midPointX }
	set midPointX(val) { this[_spriteComp].midPointX = val; }
	get midPointY() { return this[_spriteComp].midPointY }
	set midPointY(val) { this[_spriteComp].midPointY = val; }
	get halfWidth() { return this[_spriteComp].halfWidth }
	set halfWidth(val) { this[_spriteComp].halfWidth = val; }
	get halfHeight() { return this[_spriteComp].halfHeight }
	set halfHeight(val) { this[_spriteComp].halfHeight = val; }
}

const _entity$1 = Symbol('_entity');
const _spriteComp$1 = Symbol('_spriteComp');
const _x$1 = Symbol('_x');
const _y$1 = Symbol('_y');
const _followSprite = Symbol('_followSprite');
const gainNodeMap = new WeakMap();

class SpriteSoundComponent {
	constructor(src, entity) {
		this[_entity$1] = entity;
		this.src = src;
		this.play = false;
		this.volume = 1;
		this[_followSprite] = true;
	}
	get [_spriteComp$1]() { return this[_entity$1].getComponent('sprite') }
	get followSprite() { return this[_followSprite] }
	set followSprite(val) {
		if(this[_followSprite] && !val) {
			this.x = this[_spriteComp$1].midPointX;
			this.y = this[_spriteComp$1].midPointY;
		}
		this[_followSprite] = val;
	}
	get x() { return this.followSprite ? this[_spriteComp$1].midPointX : this[_x$1] }
	set x(val) { this[_x$1] = val; }
	get y() { return this.followSprite ? this[_spriteComp$1].midPointY : this[_y$1] }
	set y(val) { this[_y$1] = val; }
	set gainNode(val) {
		gainNodeMap.set(this, val);
	}
	get gainNode() {
		return gainNodeMap.get(this)
	}
}

const _state = Symbol('_symbol');

class StateComponent {
	constructor(initialState) {
		this[_state] = null;
		this.lastState = null;
		this.lastUpdate = null;
		this.grounded = false;
		this.groundHit = false;
		this.state = initialState;
	}
	get state() {
		return this[_state]
	}
	set state(val) {
		this.lastState = this[_state];
		this[_state] = val;
		this.lastUpdate = window.performance.now();
	}
}

/**
 * ExampleEntityFactory module.
 * @module ExampleEntityFactory
 */

// Import component classes
/** Class representing a particular implementation of an EntityFactory. Not intended to be part of final game engine.
 * @extends EntityFactory
 */
class ExampleEntityFactory extends EntityFactory {

	/**
	 * Create an Entity instance of the given type.
	 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
	 * @param {Object} data - Plain object that represents an entity's components.
	 * @param {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
	 * @returns {Entity}  A single Entity instance.
	 */
	create(entityType, data, compCallback) {
		let entity = super.create(entityType, data, compCallback);
		switch(entityType) {
			case 'Camera':
				entity.addComponent('camera', {
					x: data.x,
					y: data.y,
					width: data.width,
					height: data.height,
					mapX: data.mapX,
					mapY: data.mapY,
					mapWidth: data.mapWidth,
					mapHeight: data.mapHeight,
					get mapHalfWidth() { return this.mapWidth / 2 },
					get mapHalfHeight() { return this.mapHeight / 2 },
					get mapCenterX() { return this.mapX + this.mapHalfWidth },
					get mapCenterY() { return this.mapY + this.mapHalfHeight },
					following: data.following
				});
				break
			case 'Collision':
				entity.addComponent('staticPhysicsBody', {
					x: data.x,
					y: data.y,
					width: data.width,
					height: data.height,
					halfWidth: data.width / 2,
					halfHeight: data.height / 2,
					midPointX: data.x + (data.width / 2),
					midPointY: data.y + (data.height / 2)
				});
				break
			case 'PlayerSpawner':
				entity.addComponent('spawner', {
					entityType: 'Player',
					x: data.x,
					y: data.y,
					name: data.name
				});
				break
			case 'EntitySpawner':
				entity.addComponent('spawner', {
					entityType: 'Monster',
					x: data.x,
					y: data.y,
					name: data.name
				});
				break
			case 'Player':
			case 'Monster':
				entity.addComponent('spawned', {
					spawnerSource: data.spawnerSource
				});
				entity.addComponent('being', {
					type: entityType
				});
				entity.addComponent('state', new StateComponent('idle'));
				entity.addComponent('sprite', new SpriteComponent(
					data.x,
					data.y,
					data.width,
					data.height,
					(entityType === 'Player' ? 1 : 0),
					(entityType === 'Player' ? 'Player' : 'Platforms')
				));
				entity.addComponent('physicsBody', new SpritePhysicsComponent(entity));
				entity.addComponent('sound', new SpriteSoundComponent(null, entity));
		}
		return entity
	}
}

// Game's main entry point
class ExampleGameEngine extends GameEngine {
	addSystems() {
		this.addSystem('spawn', new ExampleSpawnerSystem());
		this.addSystem('update', new ExampleUpdateSystem());
		this.addSystem('physics', new ExamplePhysicsSystem());
		this.addSystem('render', new ExampleRenderSystem(this.map));
		this.addSystem('sound', new ExampleSoundSystem(this.map));
		super.addSystems();
	}
}

const game = new ExampleGameEngine('json/level3.json', new ExampleEntityFactory());
game.run();

}());
