import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import GameFetchProgressEvent from './events/fetchProgressEvent.mjs'

// -------------------------------------------------------------------------

const IMAGE_EXTENSIONS = Object.freeze(['jpg', 'jpeg', 'gif', 'bmp', 'png', 'tif', 'tiff'])
const AUDIO_EXTENSIONS = Object.freeze(['ogg', 'wav', 'mp3'])
const VIDEO_EXTENSIONS = Object.freeze(['m3u8', 'webm', 'mp4'])

const rejectIfNotOK = response => {
	if(!response.ok) throw new Error('Response not OK')
	return response
}
const fetchOK = (...args) => fetch(...args).then(rejectIfNotOK)
const resolveObj = response => response.json()
const resolveBlob = response => response.blob()
const createBlobResolveFunc = (tagName) => (response) => resolveBlob(response)
	.then((blob) => new Promise((resolve) => {
		const objUrl = URL.createObjectURL(blob)
		const obj = document.createElement(tagName)
		obj.src = objUrl
		setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
		resolve(obj)
	}))
const resolveImage = createBlobResolveFunc('img')
const resolveAudio = response => response.arrayBuffer()
const resolveVideo = createBlobResolveFunc('video')
const resolveText = response => response.text()

const fetchAsset = (path) => {
	const parts = path.split('.')
	const ext = parts.length !== 0 ? parts[parts.length - 1].toLowerCase() : 'json'

	// Select resolver
	let resolve
	if (ext === 'json') resolve = resolveObj
	else if (IMAGE_EXTENSIONS.includes(ext)) resolve = resolveImage
	else if (AUDIO_EXTENSIONS.includes(ext)) resolve = resolveAudio
	else if (VIDEO_EXTENSIONS.includes(ext)) resolve = resolveVideo
	else resolve = resolveText

	return fetchOK(path).then(resolve)
}

// -------------------------------------------------------------------------

const _AssetFetcher = new WeakMap()

/**
 * Class used to fetch assets.
 * @mixes eventTargetMixin
 */
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
	 * will be dispatched with the current percent complete. (Ex. 0.5 for 50%)
	 *
	 * @returns {Promise<Object[]>} - A promise that resolves when all assets have been fetched.
	 */
	fetchAssets() {
		const paths = [..._AssetFetcher.get(this).queuedAssetPaths]

		let count = 0
		const dispatchProgressEvent = (val) => {
			count += 1
			this.dispatchEvent(new GameFetchProgressEvent('fetchProgress', { progress: count / paths.length }))
			return val
		}
		return Promise.all(
			paths.map(path => fetchAsset(path).then(dispatchProgressEvent).then(asset => [ path, asset ]))
		)
	}

	/**
	 * Fetch an asset, bypassing the queue. Does not dispatch a "fetchProgress" event.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {Promise<*>} - Returns a promise that resolves to the fetched resource.
	 */
	fetch(path) {
		return fetchAsset(path)
	}
}

export default AssetFetcher
