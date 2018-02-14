/* globals Entity */

const TIMEOUT = 5000

describe('Entity', () => {

	// Set up testing environment
	let page
	beforeAll(async () => {
		page = await global.__BROWSER__.newPage()
		await page.goto('http://localhost/class/Entity')
	}, TIMEOUT)


	// Test Entity as an extendable class
	it('Should be extendable via `class ___ extends Entity`', async () => {
		const result = await page.evaluate(() => {
			try {
				class MyEntity extends Entity {}
				return (new MyEntity()) instanceof Entity
			} catch(e) {
				return false
			}
		})
		expect(result).toEqual(true)
	})


	// Test adding a component
	it('Should allow addition of component objects via `entity.addComponent(compName, component)`', async () => {
		const result = await page.evaluate(() => {
			try {
				const entity = new Entity()
				const component = {}
				entity.addComponent('test', component)
				return entity.hasComponent('test') && entity.getComponent('test') === component
			} catch(e) {
				return false
			}
		})
		expect(result).toEqual(true)
	})


	// Test removing a component
	it('Should allow removal of component objects via `entity.removeComponent(compName)`', async () => {
		const result = await page.evaluate(() => {
			try {
				const entity = new Entity()
				const component = {}
				entity.addComponent('test', component)
				entity.removeComponent('test')
				return !entity.hasComponent('test')
			} catch(e) {
				return false
			}
		})
		expect(result).toEqual(true)
	})


	// Test update callback
	it('Should call the provided "component updated" callback to simulate firing an event', async () => {
		const calls = await page.evaluate(() => {
			let calls = 0
			try {
				const entity = new Entity(() => { calls++ })
				const component = {}
				entity.addComponent('test', component)
				entity.removeComponent('test')
			} catch(e) {
				//
			}
			return calls
		})
		expect(calls).toEqual(2)
	})

}, TIMEOUT)
