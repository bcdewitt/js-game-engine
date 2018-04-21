const TIMEOUT = 5000

describe('Collection', () => {

	// Ensure basic indexing works
	it('Should implement basic working indexing features', async () => {
		const result = await global.page.evaluate(() => {
			const createPerson = (firstName, lastName) => ({ firstName, lastName })
			const collection = Game.createIndexedCollection()
				.add(createPerson('John', 'Doe'))
				.add(createPerson('Jane', 'Doe'))
				.add(createPerson('Bob', 'Ross'))
				.add(createPerson('Iam', 'Ninja'))
				.add(createPerson('Frank', 'Doe'))
				.setIndex('The Doe Family',
					(person) => person.lastName === 'Doe' ? { fullName: person.firstName + ' ' + person.lastName } : undefined
				)

			const objSet = collection.getIndexed('The Doe Family')
			return [...objSet]
		})
		expect(result).toEqual([
			{ fullName: 'John Doe' },
			{ fullName: 'Jane Doe' },
			{ fullName: 'Frank Doe' },
		])
	})

	// Ensure indexing works with optional observers
	it('Should implement advanced working indexing features', async () => {
		const result = await global.page.evaluate(() => {
			const collection = Game.createIndexedCollection()

			class TestComponent extends Game.Component {
				constructor(firstName, lastName) {
					super()
					this.firstName = firstName
					this.lastName = lastName
				}
			}

			const createComponent = (firstName, lastName) => {
				const comp = (new TestComponent(firstName, lastName))
					.makeObservable('lastName')
					.addEventListener('observableChange', ({ currentTarget }) => {
						collection.reindexItem(currentTarget)
					})

				return comp
			}

			const extraComp = createComponent('Frank', 'Doe')

			collection
				.add(createComponent('John', 'Doe'))
				.add(createComponent('Jane', 'Doe'))
				.add(createComponent('Bob', 'Ross'))
				.add(createComponent('Iam', 'Ninja'))
				.add(extraComp)
				.setIndex('The Doe Family',
					(person) => person.lastName === 'Doe' ? person : undefined
				)
				.delete(extraComp)

			const objSet = collection.getIndexed('The Doe Family')

			return [...objSet]
		})
		expect(result).toEqual([
			{ firstName: 'John', lastName: 'Doe' },
			{ firstName: 'Jane', lastName: 'Doe' },
		])
	})

}, TIMEOUT)
