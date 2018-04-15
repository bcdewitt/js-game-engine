import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import GameFetchProgressEvent from './events/fetchProgressEvent.mjs'
import fetchAsset from './fetchAsset.mjs'

const _AssetFetcher = new WeakMap()

/** A class used to fetch assets */
class AssetFetcher extends MixedWith(eventTargetMixin) {
	constructor() {
		super()
		_AssetFetcher.set(this, {
			queuedAssetPaths: new Set()
		})
	}

	/**
	 * Queue an asset to be fetched.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {this} - Returns self for method chaining.
	 */
	queueAsset(path) {
		if (path) _AssetFetcher.get(this).queuedAssetPaths.add(path)
		return this
	}

	/**
	 * Queue assets to be fetched.
	 *
	 * @param {string[]} [paths = []] - File path/url array at which the files may be found.
	 * @returns {this} - Returns self for method chaining.
	 */
	queueAssets(paths = []) {
		paths.forEach(path => this.queueAsset(path))
		return this
	}

	/**
	 * Fetch all queued assets. On each asset fetch, a "fetchProgress" event
	 * will be fired with the current percent complete. (Ex. 0.5 for 50%)
	 *
	 * @returns {Promise<Object[]>} - A promise that resolves when all assets have been fetched.
	 */
	fetchAssets() {
		const paths = [..._AssetFetcher.get(this).queuedAssetPaths]

		let count = 0
		const dispatchProgressEvent = () => {
			count += 1
			this.dispatchEvent(new GameFetchProgressEvent('fetchProgress', { progress: count / paths.length }))
		}
		return Promise.all(
			paths.map(path => fetchAsset(path, dispatchProgressEvent).then(asset => [ path, asset ]))
		)
	}

	/**
	 * Fetch an asset, bypassing the queue.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {Promise<*>} - Returns a promise that resolves to the fetched resource.
	 */
	fetch(path) {
		return fetchAsset(path)
	}
}

export default AssetFetcher
