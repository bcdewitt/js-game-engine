const assert = chai.assert;

// Asset Manager tests
suite('AssetManager Tests', function() {
	
	const assetManager = require('assetManager');
	
	// Catch any thrown error(s) for this test
	test('assetManager.queueDownload(path) should add path to assetManager.cache', function() {
		let path = 'some/path/file.json';
		assetManager.queueDownload(path);
		
		// Throws error when parameter = true
		assert(
			assetManager.cache[path] === undefined,
			'Path not found in cache'
		);
	});
	
	
	// Catch any thrown error(s) for this test
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