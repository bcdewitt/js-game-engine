const TIMEOUT = 5000

describe('System', () => {

	// Test for "load" event
	it('Should fire non-bubbling "load" event on load() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const assetFetcher = Game.createAssetFetcher()
			Game.createSystem()
				.addEventListener('load', e => resolve(!e.bubbles && e.assetFetcher === assetFetcher))
				.load(assetFetcher)
		}))
		expect(result).toBe(true)
	})

	// Test for "loaded" event
	it('Should fire non-bubbling "loaded" event on loaded() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const assets = new Map()
			Game.createSystem()
				.addEventListener('loaded', e => resolve(e.assets === assets))
				.loaded(assets)
		}))
		expect(result).toBe(true)
	})

	// Test for "update" event
	it('Should fire non-bubbling "update" event on update() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createSystem()
				.addEventListener('update', (e) => resolve(!e.bubbles))
				.update()
		}))
		expect(result).toBe(true)
	})


	// Test for "stopGame" event
	it('Should fire bubbling "stopGame" event on stopGame() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createSystem()
				.addEventListener('stopGame', (e) => resolve(e.bubbles))
				.stopGame()
		}))
		expect(result).toBe(true)
	})


	// Test for "stopGame" event
	it('Should fire bubbling "changeScene" event with provided sceneName attached on changeScene() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const sceneName = 'test'
			Game.createSystem()
				.addEventListener('changeScene', (e) => resolve(e.bubbles && e.sceneName === sceneName))
				.changeScene(sceneName)
		}))
		expect(result).toBe(true)
	})

}, TIMEOUT)
