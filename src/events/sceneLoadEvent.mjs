import { GameEvent } from '../gameEvent.mjs'

export default class SceneLoadEvent extends GameEvent {
	constructor(type, { assetFetcher } = {}) {
		super(type, { bubbles: true })
		Object.defineProperty(this, 'assetFetcher', { value: assetFetcher, writable: false })
	}
}
