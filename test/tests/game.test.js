const TIMEOUT = 5000

describe('Game', () => {

	// Test the most basic Game instance (create, start, stop processes)
	it('Should successfully create, start, and stop an engine instance', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const sceneFactory = Game.createSceneFactory()
				.set('sceneA', async () => Game.createScene())

			// Create Game Instance, then configure, run, and stop it
			Game.createGame()
				.setSceneFactory(sceneFactory)
				.addEventListener('stopGame', () => resolve(true))
				.run('sceneA')
				.stopGame()
		}))
		expect(result).toBe(true)
	})


	// Test for successful assetFetcher injection
	it('Should successfully use an injected assetFetcher', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const sceneFactory = Game.createSceneFactory()
				.set('sceneA', async () => Game.createScene())

			Game.createGame()
				.setSceneFactory(sceneFactory)
				.setAssetFetcher(Game.createAssetFetcher().startQueue('default'))
				.addEventListener('load', async ({ assetFetcher }) => {
					assetFetcher.queueAsset('files/test.json')
				})
				.addEventListener('loaded', async ({ assets }) => {
					resolve(assets.size === 1)
				})
				.load('sceneA')
		}))
		expect(result).toBe(true)
	})


	// Test for "changeScene" event
	it('Should fire "changeScene" event on changeScene() calls and use an injected sceneFactory', async () => {
		const result = await global.page.evaluate(async () => await new Promise(async (resolve) => {
			const sceneFactory = Game.createSceneFactory()
				.set('sceneA', async () => Game.createScene())
				.set('sceneB', async () => Game.createScene())

			// Create Game Instance
			const game = Game.createGame()
				.setSceneFactory(sceneFactory)

			// Set initial scene
			await game.changeScene('sceneA')
			const firstScene = game.getScene()

			// Listen for changeScene event
			game.addEventListener('changeScene', (e) => resolve(
				firstScene && e.currentTarget.getScene() !== firstScene
			))

			// Dispatch changeScene event
			await game.changeScene('sceneB')
		}))
		expect(result).toBe(true)
	})


	// Test for "stopGame" event
	it('Should fire "stopGame" event on stopGame() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createGame()
				.addEventListener('stopGame', () => resolve(true))
				.stopGame()
		}))
		expect(result).toBe(true)
	})

}, TIMEOUT)
