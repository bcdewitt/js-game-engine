'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

exports.GameEngine = GameEngine;
exports.System = System;
exports.EntityFactory = EntityFactory;
exports.InputManager = InputManager;
