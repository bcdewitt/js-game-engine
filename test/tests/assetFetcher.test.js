const TIMEOUT = 5000

describe('AssetFetcher', () => {

	// Test fetching json files
	it('Should fetch json files as POJO\'s', async () => {
		const result = await global.page.evaluate(async () => {
			return await Game.createAssetFetcher().fetch('files/test.json')
		})
		expect(result).toEqual({ message: 'Test Message' })
	})


	// Test fetching image files
	it('Should fetch image files as HTMLImageElement\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const asset = await Game.createAssetFetcher().fetch('files/test.jpg')
			return asset.constructor.name === 'HTMLImageElement'
		})
		expect(result).toBe(true)
	})


	// Test fetching image files
	it('Should fetch audio files as ArrayBuffer\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const asset = await Game.createAssetFetcher().fetch('files/test.mp3')
			return asset.constructor.name === 'ArrayBuffer'
		})
		expect(result).toBe(true)
	})


	// Test fetching image files
	it('Should fetch video files as HTMLVideoElement\'s', async () => {
		const result = await global.page.evaluate(async () => {
			const asset = await Game.createAssetFetcher().fetch('files/test.mp4')
			return asset.constructor.name === 'HTMLVideoElement'
		})
		expect(result).toBe(true)
	})


	// Test fetching multiple files and types
	it('Should fetch multiple files and types and fire a "fetchProgress" event', async () => {
		const result = await global.page.evaluate(async () => {
			const progressLog = []
			const assetFetcher = Game.createAssetFetcher().startQueue('default').queueAssets([
				'files/test.json',
				'files/test.jpg',
			]).addEventListener('fetchProgress', e => progressLog.push(e.progress))

			const map = await assetFetcher.fetchAssets('default')

			return {
				jsonAsset: map.get('files/test.json'),
				imgAsset: map.get('files/test.jpg').constructor.name === 'HTMLImageElement',
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
