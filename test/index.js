const assert = chai.assert;

// Asset Manager tests
suite('assetManager', function() {
	const AssetManager = require('AssetManager');

	let assetManager = new AssetManager();

	// Asynchronous test
	test('.queueDownload({ path: \'...\', reviver: function() {...} });', function(done) {
		let filePath = '../json/level2.json';
		assetManager.queueDownload({ path: filePath, reviver: function(data) {
			return data['layers'];
		}});
		assetManager.downloadAll(function() {
			let obj = assetManager.getAsset(filePath);
			done(assert(obj !== undefined, filePath + ' file failed to load'));
		});
	});


	// TODO: Replace this test
	test('assetManager.queueDownloads(paths[]) should add multiple paths to assetManager.cache', function() {
		let paths = [
			'some/path/file.json',
			'some/path/file.json',
			'some/path/file.json'
		];

		assetManager.queueDownloads(paths);

		// Throws error when parameter = true
		assert(
			!paths.every(function(path) { assetManager.cache[path] !== undefined }),
			'One or more paths not found in cache'
		);
	});


});

// ExampleRenderSystem tests
suite('ExampleRenderSystem', function() {
	const AssetManager = require('AssetManager');
	const RenderSystem = require('ExampleRenderSystem');

	let assetManager = new AssetManager();
	let renderSystem = new RenderSystem();

	// Asynchronous testing for System loading process
	test('System load logic functions as needed for GameEngine', function(done) {
		let pathsOrObjs = renderSystem.getAssetPaths();
		assetManager.queueDownloads(pathsOrObjs);
		assetManager.downloadAll(function() {
			let exists = true;
			let obj = {}; // Used collect data for next test
			for (pathOrObj of pathsOrObjs) {
				let path = (typeof pathOrObj === 'object') ?
					pathOrObj.path:
					pathOrObj;

				obj[path] = assetManager.getAsset(path);  // collect data for next test
				exists = exists && assetManager.getAsset(path);
			}
			assert(exists, 'One or more file paths returned from .getAssetPaths() are invalid');

			renderSystem.onAssetsLoaded(obj);

			assert(renderSystem.loaded, '.onAssetsLoaded() does not set loaded status to true');

			done();
		});
	});
});
