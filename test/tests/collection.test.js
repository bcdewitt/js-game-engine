const TIMEOUT = 5000

describe('Collection', () => {

	// Ensure underlying Set functionality still works
	it('Should implement working methods from the Set interface (add, delete and iterate items)', async () => {
		const result = await global.page.evaluate(() => {
			const collection = Game.createCollection()
			collection.add(1).add(2).add(3)
			collection.delete(2)

			const results = []
			for (const item of collection) {
				results.push(item)
			}

			return results.length === 2
		})
		expect(result).toBe(true)
	})

	// Ensure array method extensions work
	it('Should implement working array methods (forEach, map, filter, reduce, etc.)', async () => {
		const result = await global.page.evaluate(() => {
			const collection = Game.createCollection([1, 2, 3])

			const results = []
			collection.forEach(item => results.push(item))

			return {
				forEach: results,
				map: [...collection.map(item => item * 2)],
				reject: [...collection.reject(item => item < 2)],
				filter: [...collection.filter(item => item >= 2)],
				reduce: collection.reduce((total, item) => total + item),
				some: collection.some(item => item === 2),
				every: collection.every(item => item <= 3),
				find: collection.find(item => item === 2),
				concat: [...collection.concat(Game.createCollection([3, 4, 5]))],
			}
		})
		expect(result).toEqual({
			forEach: [1, 2, 3],
			map: [2, 4, 6],
			reject: [2, 3],
			filter: [2, 3],
			reduce: 6,
			some: true,
			every: true,
			find: 2,
			concat: [1, 2, 3, 4, 5],
		})
	})

}, TIMEOUT)
