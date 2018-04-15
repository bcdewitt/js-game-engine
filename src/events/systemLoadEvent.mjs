import { GameEvent } from '../gameEvent.mjs'

export default class SystemLoadEvent extends GameEvent {
	constructor(type, { assetFetcher } = {}) {
		super(type)
		Object.defineProperty(this, 'assetFetcher', { value: assetFetcher, writable: false })
	}
}
