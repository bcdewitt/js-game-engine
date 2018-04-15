import { eventTargetMixin } from './gameEvent.mjs'
import ObservableChangeEvent from './events/observableChangeEvent.mjs'

const handledObjs = new WeakMap()

export default Object.assign({}, eventTargetMixin, {
	construct() {
		eventTargetMixin.construct.call(this)
	},

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
})
