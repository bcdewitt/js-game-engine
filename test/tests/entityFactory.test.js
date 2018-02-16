/* globals EntityFactory */

const TIMEOUT = 5000

describe('EntityFactory', () => {

	// Set up testing environment
	let page
	beforeAll(async () => {
		page = await global.__BROWSER__.newPage()
		await page.goto('http://localhost/class/EntityFactory')
	}, TIMEOUT)

	// Test EntityFactory as an extendable class
	it('Should be extendable via `class ___ extends EntityFactory`', async () => {
		const result = await page.evaluate(() => {
			try {
				class MyEntityFactory extends EntityFactory {}
				return (new MyEntityFactory()) instanceof EntityFactory
			} catch(e) {
				return false
			}
		})
		expect(result).toEqual(true)
	})


	// Test creating an Entity
	it('Should allow overriding of create() method to create entities with certain components', async () => {
		const result = await page.evaluate(() => {
			try {
				class MyEntityFactory extends EntityFactory {
					create(entityType, data, compCallback) {
						let entity = super.create(entityType, data, compCallback)
						switch(entityType) {
							case 'WithComponent':
								entity.addComponent('someComponent', { test: 'test', val: data.val })
								break
						}
						return entity
					}
				}
				const entityFactory = new MyEntityFactory()
				const entity = entityFactory.create('WithComponent', { val: 'test2' })
				return entity.constructor.name === 'Entity' &&
					entity.hasComponent('someComponent')
			} catch(e) {
				return false
			}
		})
		expect(result).toEqual(true)
	})

}, TIMEOUT)
