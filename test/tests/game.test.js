const TIMEOUT = 5000

describe('Game', () => {

	// Test the most basic Game instance (create, start, stop processes)
	it('Should successfully create, start, and stop an engine instance', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {

			// Create Game Instance, then configure, run, and stop it
			const sceneA = Game.createScene()
			Game.createGame()
				.setScene('sceneA', sceneA)
				.addEventListener('stopGame', (e) => {
					const hasSceneWithName = e.currentTarget.hasScene('sceneA')
					const hasMatchingScene = e.currentTarget.getScene('sceneA') === sceneA
					resolve(hasSceneWithName && hasMatchingScene)
				})
				.run('sceneA')
				.stopGame()
		}))
		expect(result).toBe(true)
	})


	// Test for "changeScene" event (requires scenes)
	it('Should fire "changeScene" event on changeScene() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {

			// Create Game Instance
			const sceneB = Game.createScene()
			let returnVal = null
			Game.createGame()
				.setScene('sceneA', Game.createScene())
				.setScene('sceneB', sceneB)
				.addEventListener('changeScene', (e) => {
					returnVal = e.currentTarget.getScene() === sceneB
				})
				.addEventListener('stopGame', () => {
					resolve(returnVal)
				})
				.run('sceneA')
				.changeScene('sceneB')
				.stopGame()
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

/*
TODO:
Test for expected failures/errors

.addTransition('start', 'pause', (startScene, pauseScene, deltaTime) => {
	// pauseScene.cloneEntitiesFrom(startScene)
	pauseScene.cloneSystemsFrom(startScene)
	startScene.transitionOut(deltaTime)
	pauseScene.transitionIn(deltaTime)
})
*/
