import { eventTargetMixin } from './gameEvent.mjs'
import ObservableChangeEvent from './events/observableChangeEvent.mjs'

const handledObjs = new WeakMap()

/**
 * Observable mixin
 *
 * This provides properties and methods used for observing property value
 * changes and/or method calls.
 *
 * @mixin observableMixin
 * @mixes eventTargetMixin
 */
const observableMixin = {
	construct() {
		eventTargetMixin.construct.call(this)
	},

	/**
	 * Observes and dispatches an ObservableChangeEvent each time the specified
	 * property changes or method is called.
	 *
	 * @param {string} prop - Name of property/method to observe.
	 * @returns {this} - Returns self for method chaining.
	 */
	makeObservable(prop) {
		if (!handledObjs.has(this))
			handledObjs.set(this, new Set())
		const handledProps = handledObjs.get(this)

		if (handledProps.has(prop)) return

		let val = this[prop]
		const descriptor = Reflect.getOwnPropertyDescriptor(this, prop)

		// Observe method calls
		if (typeof val === 'function') {
			Reflect.defineProperty(this, prop, Object.assign({
				get() {
					return (...args) => {
						this.dispatchEvent(new ObservableChangeEvent('observableChange', { prop, args }))
						return val.call(this, ...args)
					}
				},
				set(inVal) { val = inVal }
			}, descriptor))

		// Observe property changes
		} else {
			Reflect.defineProperty(this, prop, Object.assign({
				get() { return val },
				set(inVal) {
					this.dispatchEvent(new ObservableChangeEvent('observableChange', { prop, args: [ inVal ] }))
					val = inVal
				}
			}, descriptor))
		}
		return this
	},
}

export default Object.assign({}, eventTargetMixin, observableMixin)
