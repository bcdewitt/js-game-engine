/**
 * assetManager module.
 * @module assetManager
 */
// Asset Loader/Manager (http://www.html5rocks.com/en/tutorials/games/assetmanager/)
define('assetManager', function(module) {
	'use strict';

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
			this.downloadQueue = [];
			this.successCount = 0;
			this.errorCount = 0;
		}

		/**
		 * Queue a file for download.
		 * @param  {string}  path - File path/url at which the file may be found.
		 * @param  {boolean=}  forceDownload - Setting this to true will add the file even if it is found in the cache.
		 */
		queueDownload(path, forceDownload) {
			if(forceDownload || !this.cache[path])
				this.downloadQueue.push(path);
		}

		/**
		 * Queue multiple files for download.
		 * @param  {string[]}  paths - File paths/urls at which the files may be found.
		 * @param  {boolean=}  forceDownload - Setting this to true will add the files even if it is found in the cache.
		 */
		queueDownloads(paths, forceDownload) {
			let i = 0, l = paths.length;
			for ( ; i < l; i++) {
				this.queueDownload(paths[i], forceDownload);
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
				return;
			}

			let handleDownload = (path, obj, success) => {

				if(success) {
					this.successCount += 1;
					//console.log(path + ' is loaded');
				} else {
					this.errorCount += 1;
					//console.log('Error: Could not load ' + path);
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
				for (let i = 0; i < this.downloadQueue.length; i++) {
					let path = this.downloadQueue[i];
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
							break;

						// Audio
						case 'ogg':
						case 'wav':
						case 'mp3':
							asset = new Audio();
							loadEventName = 'canplaythrough';
							asset.crossOrigin = 'anonymous';
							break;

						// Video
						case 'm3u8':
						case 'webm':
						case 'mp4':
							asset = document.createElement('video');
							loadEventName = 'canplaythrough';
							break;

						// JSON
						case 'json':
							(function() {
								let innerPath = path; // This and the outer function were needed to keep the path
								let httpRequest = new XMLHttpRequest();

								httpRequest.onreadystatechange = function () {
									if (this.readyState === 4) {
										if (this.status === 200) {
											let data = JSON.parse(this.responseText);
											handleDownload(innerPath, data, true);
										} else {
											handleDownload(innerPath, null, false);
										}
									}
								};
								httpRequest.open('GET', innerPath, true);
								httpRequest.send();
							})();
							continue;
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
			return (this.downloadQueue.length === this.successCount + this.errorCount);
		}

		/**
		 * Gets the previously downloaded file from this AssetManager instance's cache.
		 * @param {string} path - The path to the previously downloaded asset.
		 * @returns {*}  Returns an object representing the previously downloaded asset.
		 */
		getAsset(path) {
			return this.cache[path];
		}

	}

	module.exports = new AssetManager();
});
