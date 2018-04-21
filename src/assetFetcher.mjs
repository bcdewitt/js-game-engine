import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import FetchProgressEvent from './events/fetchProgressEvent.mjs'

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
		this.reset()
	}

	get queue() {
		const _this = _AssetFetcher.get(this)
		return _this.queues.get(_this.currentQueue)
	}

	/**
	 * Resets this instance, reverting totalCount and removing existing queues
	 */
	reset() {
		_AssetFetcher.set(this, {
			queues: new Map(),
			currentQueue: null,
			totalCount: 0,
		})
	}

	/**
	 * Creates a new queue to be used from now until reset or startQueue is called again.
	 *
	 * @param {*} queueKey - Value used as a key to uniquely identify a queue.
	 * @returns {this} - Returns self for method chaining.
	 */
	startQueue(queueKey) {
		const _this = _AssetFetcher.get(this)
		_this.currentQueue = queueKey
		_this.queues.set(queueKey, new Set())
		return this
	}

	/**
	 * Queue an asset to be fetched.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {this} - Returns self for method chaining.
	 */
	queueAsset(path) {
		const _this = _AssetFetcher.get(this)
		if (_this.currentQueue === null)
			throw new Error('Must start a queue before queuing assets')

		if (path) {
			this.queue.add(path)
			_AssetFetcher.get(this).totalCount++
		}
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
	 * @async
	 * @param {*} queueKey - Value used as a key to uniquely identify a queue.
	 * @returns {Object[]} - All assets that have been fetched.
	 */
	async fetchAssets(queueKey) {
		const _this = _AssetFetcher.get(this)

		let count = 0
		const dispatchProgressEvent = () => {
			count += 1
			this.dispatchEvent(new FetchProgressEvent('fetchProgress', { progress: count / _this.totalCount }))
		}

		const outerPromises = []
		_this.queues.forEach((set, key) => {
			const innerPromises = [...set].map(async (path) => {
				const asset = await fetchAsset(path)
				dispatchProgressEvent()
				return [ path, asset ]
			})
			outerPromises.push(
				Promise.all(innerPromises).then(entries => {
					return [ key, new Map(entries) ]
				}))
		})
		const data = await Promise.all(outerPromises)

		this.reset()

		const allFetched = new Map(data)
		_this.totalCount = 0
		if (queueKey) return allFetched.get(queueKey)
		return allFetched
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
