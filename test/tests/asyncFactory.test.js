const TIMEOUT = 5000

describe('AsyncFactory', () => {

	// Test that set() and create() methods operate as expected
	it('Should successfully set a constructor and create an object using that constructor', async () => {
		const result = await global.page.evaluate(async () => {
			const testName = 'test'
			const testData = { foo: 'bar' }

			const objFactory = Game.createAsyncFactory()
				.set(testName, async (name, data) => ({ name, data }))

			return await objFactory.create(testName, testData)
		})

		expect(result).toEqual({
			name: 'test',
			data: { foo: 'bar' }
		})
	})

	// Test that use() method operates correctly
	it('Should successfully use a middleware function to create an arbitrary object', async () => {
		const result = await global.page.evaluate(async () => {
			const testName = 'test'
			const testData = { foo: 'bar' }

			const objFactory = Game.createAsyncFactory()
				.use(async (name, data) => ({ value: data.foo }))
				.set(testName, async (name, data) => ({
					namesMatch: testName === name,
					dataMatches: data.value === testData.foo,
				}))

			return await objFactory.create(testName, testData)
		})
		expect(result).toEqual({
			namesMatch: true,
			dataMatches: true,
		})
	})

}, TIMEOUT)
