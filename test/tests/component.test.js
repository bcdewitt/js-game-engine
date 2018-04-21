const TIMEOUT = 5000

describe('Component', () => {

	// Test for parent Entity
	it('Should successfully assign a parent Entity', async () => {
		const result = await global.page.evaluate(() => {
			const entity = Game.createEntity()
			entity.setComponent('aComp', Game.createComponent())
			return entity.getComponent('aComp').getParentEntity() === entity
		})
		expect(result).toBe(true)
	})

	// Test for class-based syntax
	it('Should allow extension of the Component class', async () => {
		const result = await global.page.evaluate(() => {
			class TestComponent extends Game.Component {
				constructor() {
					super()
					this.foo = 'bar'
				}

			}
			const testComponent = new TestComponent()
			return testComponent.getParentEntity !== undefined && testComponent.foo === 'bar'
		})
		expect(result).toBe(true)
	})

}, TIMEOUT)
