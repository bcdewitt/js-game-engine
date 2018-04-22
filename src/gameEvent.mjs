/**
 * Module containing the GameEvent constructor and eventTargetMixin.
 * @module GameEvent
 */

import Collection from './collection.mjs'

const _GameEvent = new WeakMap()
let propagatingEvent = null // Keeps track of the currently propagating event to cancel out duplicate events

/**
 * Class representing an event fired by a game object. (API based on web standards)
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

	/**
	 * Prevents further propagation of the current event.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopPropagation() {
		_GameEvent.get(this).propagate = false
		return this
	}

	/**
	 * Prevents other listeners of the same event from being called.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopImmediatePropagation() {
		const _this = _GameEvent.get(this)
		_this.propagate = false
		_this.propagateImmediate = false
		return this
	}
}

const _eventTargetMixin = new WeakMap()

/**
 * Event Target mixin
 *
 * This provides properties and methods used for game event handling.
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

	/**
	 * Dispatches an Event to the specified EventTarget, asynchronously invoking
	 * the affected EventListeners in the appropriate order.
	 *
	 * @async
	 * @param {GameEvent} e - Event to dispatch.
	 */
	async dispatchEventAsync(e) {
		// TODO: DRY this up by using shared code between this and .dispatchEvent()

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
		const collection = _this.listeners.get(e.type)
		const promises = []
		if (collection) {
			for (const listener of collection.values()) {
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

	/**
	 * Dispatches an Event to the specified EventTarget, (synchronously) invoking
	 * the affected EventListeners in the appropriate order.
	 *
	 * @param {GameEvent} e - Event to dispatch.
	 * @returns {this} - Returns self for method chaining.
	 */
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
		const collection = _this.listeners.get(e.type)
		if (collection) {
			for (const listener of collection.values()) {
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

	/**
	 * Sets up a function to be called whenever the specified event is dispatched to the target.
	 *
	 * @param {string} type - A case-sensitive string representing the event type to listen for.
	 * @param {function} listener - Function that is called when an event of the specified type occurs.
	 * @param {Object} options - An options object that specifies characteristics about the event listener.
	 *     For now, only "once" is supported, which, if true, would automatically remove the listener when invoked.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEventListener(type, listener, options) {
		const _this = _eventTargetMixin.get(this)
		const set = _this.listeners.has(type) ? _this.listeners.get(type) : new Collection()
		set.add(listener)

		_this.listeners.set(type, set)
		_this.listenerOptions.set(listener, options)
		return this
	},

	/**
	 * Removes from the EventTarget an event listener previously registered with EventTarget.addEventListener().
	 *
	 * @param {string} type - A case-sensitive string representing the event for which to remove an event listener.
	 * @param {function} listener - Event listener function to remove from the event target.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeEventListener(type, listener) {
		const set = _eventTargetMixin.get(this).listeners.get(type)
		if (!set) return
		set.delete(listener)
		return this
	},

	/**
	 * Designates the EventTarget as a source of bubbling events.
	 *
	 * @param {*} child - EventTarget from which events should bubble.
	 * @returns {this} - Returns self for method chaining.
	 */
	propagateEventsFrom(child) {
		const _child = _eventTargetMixin.get(child)
		if (_child) _child.parent = this
		return this
	},

	/**
	 * Removes the EventTarget as a source of bubbling events.
	 *
	 * @param {*} child - EventTarget from which events should no longer bubble.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopPropagatingFrom(child) {
		const _child = _eventTargetMixin.get(child)
		if (_child && _child.parent === this) _child.parent = null
		return this
	}
}

export { GameEvent, eventTargetMixin }
