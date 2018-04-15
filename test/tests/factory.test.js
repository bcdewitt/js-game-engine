const TIMEOUT = 5000

describe('Factory', () => {

	// Test that set() and create() methods operate as expected
	it('Should successfully set a constructor and create an object using that constructor', async () => {
		const result = await global.page.evaluate(() => {
			const testName = 'test'
			const testData = { foo: 'bar' }

			const objFactory = Game.createFactory()
				.set(testName, (name, data) => ({ name, data }))

			return objFactory.create(testName, testData)
		})

		expect(result).toEqual({
			name: 'test',
			data: { foo: 'bar' }
		})
	})

	// Test that use() method operates correctly
	it('Should successfully use a middleware function to create an arbitrary object', async () => {
		const result = await global.page.evaluate(() => {
			const testName = 'test'
			const testData = { foo: 'bar' }

			const objFactory = Game.createFactory()
				.use((name, data) => ({ value: data.foo }))
				.set(testName, (name, data) => ({
					namesMatch: testName === name,
					dataMatches: data.value === testData.foo,
				}))

			return objFactory.create(testName, testData)
		})
		expect(result).toEqual({
			namesMatch: true,
			dataMatches: true,
		})
	})

	// Test that use() method operates correctly
	it('Should successfully use middleware functions to create Components, Entities, Systems and Scenes', async () => {

		const result = await global.page.evaluate(async () => await new Promise(async (resolve) => {
			const outerResolve = resolve
			const sceneFactory = Game.createSceneFactory()
				.use(async (sceneName, sceneData) => {

					// System Factory
					sceneData.systemFactory.set('testSystem', async (name, { system }) =>
						system.addEventListener('update', () => outerResolve(true))
					)

					// Entity Factory
					sceneData.entityFactory
						.use((entityName, entityData) => {
							entityData.componentFactory.set('testComponent', (name, { component, data }) =>
								component.decorate(data)
							)
							return entityData
						})
						.set('testEntity', (name, { entity, componentFactory }) =>
							entity.setComponent('aComp', componentFactory.create('testComponent'))
						)

					return sceneData
				})
				.set('testScene', async (name, { scene, systemFactory, entityFactory }) =>
					scene
						.setSystem('update', await systemFactory.create('testSystem'))
						.addEntity(entityFactory.create('testEntity'))
				)
			const scene = await sceneFactory.create('testScene')
			scene.update(performance.now())
		}))
		expect(result).toBe(true)
	})

}, TIMEOUT)
