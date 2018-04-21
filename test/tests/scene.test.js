const TIMEOUT = 5000

describe('Scene', () => {


	// Test for simple Entity Management
	it('Should successfully manage Entities (add, has, get and remove)', async () => {
		const result = await global.page.evaluate(() => {
			const entity = Game.createEntity()
			const scene = Game.createScene().addEntity(entity)
			const hadEntity = scene.hasEntity(entity)
			const [ grabbedEntity ] = scene.getEntities()
			scene.removeEntity(entity)
			const remainingEntities = scene.getEntities()
			return {
				hadEntity,
				grabbedEntityCorrect: grabbedEntity === entity,
				zeroRemainingEntities: remainingEntities.size === 0,
			}
		})
		expect(result).toEqual({
			hadEntity: true,
			grabbedEntityCorrect: true,
			zeroRemainingEntities: true,
		})
	})


	// Test for advanced Entity Management
	it('Should successfully index Entities for subsets', async () => {
		const result = await global.page.evaluate(() => {
			const createEntity = key => {
				const entity = Game.createEntity()
				entity.key = key
				return entity
			}

			const scene = Game.createScene()
				.setEntityIndexer('test', entity => entity.key === 5)

			// Add 3 items (should be indexed at 'test' using the indexer above)
			;[5, 3, 5].forEach(key => scene.addEntity(createEntity(key)))

			const entitySubset = scene.getEntities('test')
			return {
				subsetSize: entitySubset.size,
				fullSetSize: scene.getEntities().size,
			}
		})
		expect(result).toEqual({
			subsetSize: 2,
			fullSetSize: 3,
		})
	})


	// Test for System Management
	it('Should successfully manage Systems (set, has, get and remove)', async () => {
		const result = await global.page.evaluate(() => {
			const system = Game.createSystem()
			const systemName = 'test'
			const scene = Game.createScene().setSystem(systemName, system)
			const hadSystem = scene.hasSystem(systemName)
			const gotSystem = scene.getSystem(systemName) === system
			scene.removeSystem(systemName)
			const gotUndefined = scene.getSystem(systemName) === undefined
			return { hadSystem, gotSystem, gotUndefined }
		})
		expect(result).toEqual({ hadSystem: true, gotSystem: true, gotUndefined: true })
	})


	// Test for "stopGame" event
	it('Should fire bubbling "stopGame" event on stopGame() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createScene()
				.addEventListener('stopGame', (e) => resolve(e.bubbles))
				.stopGame()
		}))
		expect(result).toBe(true)
	})


	// Test for "changeScene" event
	it('Should fire bubbling "changeScene" event on changeScene() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createScene()
				.addEventListener('changeScene', (e) => resolve(e.bubbles))
				.changeScene()
		}))
		expect(result).toBe(true)
	})


	// Test for "load" event
	it('Should fire bubbling "load" event on load() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const assetFetcher = Game.createAssetFetcher()
			Game.createScene()
				.addEventListener('load', async (e) => resolve(e.bubbles && e.assetFetcher === assetFetcher))
				.load(assetFetcher)
		}))
		expect(result).toBe(true)
	})

	// Test for "fetchProgress" event
	it('Should fire bubbling "fetchProgress" event on load() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			const progressLog = []
			const assetFetcher = Game.createAssetFetcher()
			Game.createScene()
				.addEventListener('load', async ({ assetFetcher }) => assetFetcher.queueAssets([
					'files/test.json',
					'files/test.jpg',
				]))
				.addEventListener('fetchProgress', e => progressLog.push(e.progress))
				.addEventListener('loaded', async (e) => resolve({ bubbles: e.bubbles, progressLog }))
				.load(assetFetcher)
		}))
		expect(result).toEqual({
			bubbles: true,
			progressLog: [ 0.5, 1 ],
		})
	})

	// Test for "load" event
	it('Should fire bubbling "loaded" event on load() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise((resolve) => {
			Game.createScene()
				.addEventListener('load', async ({ assetFetcher }) => {
					assetFetcher.queueAsset('files/test.json')
				})
				.addEventListener('loaded', async (e) => resolve(e.bubbles && !!e.assets))
				.load(Game.createAssetFetcher())
		}))
		expect(result).toBe(true)
	})

	// Test for "update" event
	it('Should fire bubbling "update" event on update() calls', async () => {
		const result = await global.page.evaluate(async () => await new Promise(async (resolve) => {
			(await Game.createScene())
				.addEventListener('update', (e) => resolve(e.bubbles))
				.update(performance.now())
		}))
		expect(result).toBe(true)
	})
}, TIMEOUT)
