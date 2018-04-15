import Collection from './collection.mjs'

const _GameEvent = new WeakMap()
let propagatingEvent = null // Keeps track of the currently propagating event to cancel out duplicate events

/**
 * Class representing an event fired by a game object.
 */
class GameEvent {
	constructor(type, { bubbles } = {}) {
		const _this = {
			target: null,
			currentTarget: null,
			propagateImmediate: true,
			propagate: !!bubbles,
		}
		_GameEvent.set(this, _this)

		this.timestamp = null
		Object.defineProperty(this, 'type', { value: type, writable: false })
		Object.defineProperty(this, 'bubbles', { value: !!bubbles, writable: false })
		Object.defineProperty(this, 'target', { get() { return _this.target } })
		Object.defineProperty(this, 'currentTarget', { get() { return _this.currentTarget } })
	}

	stopPropagation() {
		_GameEvent.get(this).propagate = false
	}

	stopImmediatePropagation() {
		const _this = _GameEvent.get(this)
		_this.propagate = false
		_this.propagateImmediate = false
	}
}

const _eventTargetMixin = new WeakMap()

/**
 * Event Target mixin
 *
 * This provides properties and methods used for game event handling.
 * It's not meant to be used directly.
 *
 * @mixin eventTargetMixin
 */
const eventTargetMixin = {
	construct() {
		_eventTargetMixin.set(this, {
			listeners: new Map(),
			listenerOptions: new WeakMap(),
			parent: null,
		})
	},

	// TODO: DRY this up
	async dispatchEventAsync(e) {
		// Prevent duplicate events during propagation
		if (propagatingEvent && propagatingEvent.currentTarget === this) return

		const _this = _eventTargetMixin.get(this)
		const _event = _GameEvent.get(e)

		// Modify event's private properties
		if (_event.target === null) {
			_event.timestamp = performance.now()
			_event.target = this
		}
		_event.currentTarget = this

		// Loop over listeners (break out when e.stopImmediatePropagation() is called)
		const set = _this.listeners.get(e.type)
		let promises = []
		if (set) {
			for (const listener of set) {
				const options = _this.listenerOptions.get(listener)
				promises.push(listener.call(this, e))
				if (options && options.once) this.removeEventListener(e.type, listener)
				if (!_event.propagateImmediate) break
			}
		}

		// If this event propagates, dispatch event on parent
		if (_event.propagate && _this.parent) {
			propagatingEvent = e
			promises.push(_this.parent.dispatchEventAsync(e))
		} else {
			propagatingEvent = null
		}
		await Promise.all(promises)
	},

	dispatchEvent(e) {
		// Prevent duplicate events during propagation
		if (propagatingEvent && propagatingEvent.currentTarget === this) return

		const _this = _eventTargetMixin.get(this)
		const _event = _GameEvent.get(e)

		// Modify event's private properties
		if (_event.target === null) {
			_event.timestamp = performance.now()
			_event.target = this
		}
		_event.currentTarget = this

		// Loop over listeners (break out when e.stopImmediatePropagation() is called)
		const set = _this.listeners.get(e.type)
		if (set) {
			for (const listener of set) {
				const options = _this.listenerOptions.get(listener)
				listener.call(this, e)
				if (options && options.once) this.removeEventListener(e.type, listener)
				if (!_event.propagateImmediate) break
			}
		}

		// If this event propagates, dispatch event on parent
		if (_event.propagate && _this.parent) {
			propagatingEvent = e
			_this.parent.dispatchEvent(e)
		} else {
			propagatingEvent = null
		}
		return this
	},

	addEventListener(type, listener, options) {
		const _this = _eventTargetMixin.get(this)
		const set = _this.listeners.has(type) ? _this.listeners.get(type) : new Collection()
		set.add(listener)

		_this.listeners.set(type, set)
		_this.listenerOptions.set(listener, options)
		return this
	},

	removeEventListener(type, listener) {
		const set = _eventTargetMixin.get(this).listeners.get(type)
		if (!set) return
		set.delete(listener)
		return this
	},

	propagateEventsFrom(child) {
		const _child = _eventTargetMixin.get(child)
		if (_child) _child.parent = this
		return this
	},

	stopPropagatingFrom(child) {
		const _child = _eventTargetMixin.get(child)
		if (_child && _child.parent === this) _child.parent = null
		return this
	}
}

export { GameEvent, eventTargetMixin }
