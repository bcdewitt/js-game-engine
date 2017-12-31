const _state = Symbol('_symbol')

export default class StateComponent {
	constructor(initialState) {
		this[_state] = null
		this.lastState = null
		this.lastUpdate = null
		this.grounded = false
		this.groundHit = false
		this.state = initialState
	}
	get state() {
		return this[_state]
	}
	set state(val) {
		this.lastState = this[_state]
		this[_state] = val
		this.lastUpdate = window.performance.now()
	}
}
