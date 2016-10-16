// Asset Loader/Manager (http://www.html5rocks.com/en/tutorials/games/assetmanager/)
define('assetManager', function(module) {
	'use strict';

	class AssetManager {
		constructor() {
			this.cache = {};
			this.init();
		}

		init() {
			this.downloadQueue = [];
			this.successCount = 0;
			this.errorCount = 0;
		}

		queueDownload(path, forceDownload) {
			if(forceDownload || !this.cache[path])
				this.downloadQueue.push(path);
		}

		queueDownloads(paths, forceDownload) {
			let i = 0, l = paths.length;
			for ( ; i < l; i++) {
				this.queueDownload(paths[i], forceDownload);
			}
		}

		downloadAll(downloadCallback, progCallback) {
			if (this.downloadQueue.length === 0) {
				progCallback && progCallback(1.00);
				downloadCallback();
				return;
			}

			var that = this;
			function handleDownload(path, obj, success) {

				if(success) {
					that.successCount += 1;
					//console.log(path + ' is loaded');
				} else {
					that.errorCount += 1;
					//console.log('Error: Could not load ' + path);
				}

				if (that.isDone()) {
					progCallback && progCallback(1.00);
					that.init();
					that.cache[path] = obj;
					downloadCallback();
				} else {
					that.cache[path] = obj;
					progCallback && progCallback((that.successCount + that.errorCount) / that.downloadQueue.length);
				}
			}

			(function() {
				for (var i = 0; i < that.downloadQueue.length; i++) {
					var path = that.downloadQueue[i];
					var parts = path.split('.');
					var ext = parts[parts.length - 1];
					var asset;
					var loadEventName = 'load';

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
								var innerPath = path; // This and the outer function were needed to keep the path
								var httpRequest = new XMLHttpRequest();

								httpRequest.onreadystatechange = function () {
									if (this.readyState === 4) {
										if (this.status === 200) {
											var data = JSON.parse(this.responseText);
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

		isDone() {
			return (this.downloadQueue.length === this.successCount + this.errorCount);
		}

		getAsset(path) {
			return this.cache[path];
		}

	}

	module.exports = new AssetManager();
});
