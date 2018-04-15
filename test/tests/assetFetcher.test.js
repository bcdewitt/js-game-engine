const TIMEOUT = 5000

describe('AssetFetcher', () => {

	// Test fetching json files
	it('Should fetch json files as POJO\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const game = Game.createAssetFetcher().queueAsset('files/test.json')
			const [ [ , asset ] ] = await game.fetchAssets()
			return asset
		})
		expect(result).toEqual({ message: 'Test Message' })
	})


	// Test fetching image files
	it('Should fetch image files as HTMLImageElement\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const game = Game.createAssetFetcher().queueAsset('files/test.jpg')
			const [ [ , asset ] ] = await game.fetchAssets()
			return asset.constructor.name === 'HTMLImageElement'
		})
		expect(result).toBe(true)
	})


	// Test fetching image files
	it('Should fetch audio files as ArrayBuffer\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const game = Game.createAssetFetcher().queueAsset('files/test.mp3')
			const [ [ , asset ] ] = await game.fetchAssets()
			return asset.constructor.name === 'ArrayBuffer'
		})
		expect(result).toBe(true)
	})


	// Test fetching image files
	it('Should fetch video files as HTMLVideoElement\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const game = Game.createAssetFetcher().queueAsset('files/test.mp4')
			const [ [ , asset ] ] = await game.fetchAssets()
			return asset.constructor.name === 'HTMLVideoElement'
		})
		expect(result).toBe(true)
	})


	// Test fetching multiple files and types
	it('Should fetch multiple files and types and fire a "fetchProgress" event', async () => {
		const result = await global.page.evaluate(async () => {
			const progressLog = []
			const game = Game.createAssetFetcher().queueAssets([
				'files/test.json',
				'files/test.jpg',
			]).addEventListener('fetchProgress', e => progressLog.push(e.progress))

			const [ [,jsonAsset], [,imgAsset] ] = await game.fetchAssets()

			return {
				jsonAsset,
				imgAsset: imgAsset.constructor.name === 'HTMLImageElement',
				progressLog,
			}
		})

		expect(result).toEqual({
			jsonAsset: { message: 'Test Message' },
			imgAsset: true,
			progressLog: [ 0.5, 1 ],
		})
	})

}, TIMEOUT)
