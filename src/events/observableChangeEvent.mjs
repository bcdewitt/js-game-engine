import { GameEvent } from '../gameEvent.mjs'

export default class ObservableChangeEvent extends GameEvent {
	constructor(type, { prop, args } = {}) {
		super(type)
		Object.defineProperty(this, 'prop', { value: prop, writable: false })
		Object.defineProperty(this, 'args', { value: args, writable: false })
	}
}
