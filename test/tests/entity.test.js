const TIMEOUT = 5000

describe('Entity', () => {

	// Test for simple Component Management
	it('Should successfully manage Components (set, has, get and remove)', async () => {
		const result = await global.page.evaluate(() => {
			const compName = 'test'
			const comp = Game.createComponent({ val: 1337 })
			const entity = Game.createEntity()
				.setComponent(compName, comp)

			const componentSet = entity.hasComponent(compName) && entity.getComponent(compName) === comp
			entity.removeComponent(compName)
			const componentUnset = !entity.hasComponent(compName) && entity.getComponent(compName) !== comp

			return { componentSet, componentUnset }
		})

		expect(result).toEqual({
			componentSet: true,
			componentUnset: true,
		})
	})

}, TIMEOUT)
