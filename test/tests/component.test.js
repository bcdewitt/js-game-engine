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

	// Test for decoration functionality
	it('Should successfully decorate any object', async () => {
		const result = await global.page.evaluate(() => {
			const _job = Symbol('_job')
			class Person {
				constructor() {
					this[_job] = 'Programmer'
					this.firstName = 'John'
					this.lastName = 'Doe'
				}
				get job() { return this[_job] }
				set job(val) { this[_job] = val }
				getFullName() {
					return this.firstName + ' ' + this.lastName
				}
			}
			const comp = Game.createComponent().decorate(new Person())

			return {
				firstName: comp.firstName,
				lastName: comp.lastName,
				job: comp.job,
				fullName: comp.getFullName(),
			}
		})
		expect(result).toEqual({
			firstName: 'John',
			lastName: 'Doe',
			job: 'Programmer',
			fullName: 'John Doe',
		})
	})

}, TIMEOUT)
