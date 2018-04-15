const TIMEOUT = 5000

describe('TiledMap', () => {

	// Test interfacing with engine.queueAsset() and .fetchAssets()
	it('Should interface with engine.queueAsset() and .fetchAssets()', async () => {
		const result = await global.page.evaluate(async () => {

			// Load data to create a TiledMap instance
			const assetFetcher = Game.createAssetFetcher()
			assetFetcher.queueAsset('files/tiledData.json')
			const [ [ ,data ] ] = await assetFetcher.fetchAssets()

			// Initialize a TiledMap instance
			const tiledMap = Game.createTiledMap()
				.setBasePath((new URL('files/', window.location.href)).href)
				.decorate(data)

			// Load and add the necessary resources to the TiledMap instance
			assetFetcher.queueAssets(tiledMap.getResourcePaths())
			tiledMap.setResources(await assetFetcher.fetchAssets())

			return {
				tilesetImageLoaded: tiledMap.getResource('tileset.png') instanceof HTMLImageElement,
				bgmLoaded: tiledMap.getResource('test.mp3') instanceof ArrayBuffer,
			}
		})
		expect(result).toEqual({
			tilesetImageLoaded: true,
			bgmLoaded: true,
		})
	})



	// Test fetching json files
	it('Should draw layer to context', async () => {
		const result = await global.page.evaluate(async () => {
			const getBlankCanvas = (width, height) => {
				const blankCanvas = document.createElement('canvas')
				blankCanvas.width = width
				blankCanvas.height = height
				return blankCanvas
			}

			// Load data to create a TiledMap instance
			const assetFetcher = Game.createAssetFetcher()
			assetFetcher.queueAsset('files/tiledData.json')
			const [ [ ,data ] ] = await assetFetcher.fetchAssets()

			// Initialize a TiledMap instance
			const tiledMap = Game.createTiledMap()
				.setBasePath((new URL('files/', window.location.href)).href)
				.decorate(data)

			// Load and add the necessary resources to the TiledMap instance
			assetFetcher.queueAssets(tiledMap.getResourcePaths())
			tiledMap.setResources(await assetFetcher.fetchAssets())

			const canvas = document.createElement('canvas')
			canvas.width = 1000
			canvas.height = 1000
			const context = canvas.getContext('2d')

			tiledMap.render(context,
				'Background',
				performance.now(),
				0, 0, canvas.width, canvas.height,
				0, 0, canvas.width, canvas.height
			)

			const canvasIsBlank = canvas.toDataURL() === getBlankCanvas(canvas.width, canvas.height).toDataURL()
			return { canvasIsBlank }
		})
		expect(result).toEqual({ canvasIsBlank: false })
	})

}, TIMEOUT)
