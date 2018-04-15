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

// fetchAsset() - fetches and converts the response into the appropriate type of object
export default (path, callback) => {
	const parts = path.split('.')
	const ext = parts.length !== 0 ? parts[parts.length - 1].toLowerCase() : 'json'

	// Select resolver
	let resolve
	if (ext === 'json') resolve = resolveObj
	else if (IMAGE_EXTENSIONS.includes(ext)) resolve = resolveImage
	else if (AUDIO_EXTENSIONS.includes(ext)) resolve = resolveAudio
	else if (VIDEO_EXTENSIONS.includes(ext)) resolve = resolveVideo
	else resolve = resolveText

	if (callback) {
		const wrappedCallback = val => {
			callback(val)
			return val
		}
		return fetchOK(path).then(resolve).then(wrappedCallback).catch(wrappedCallback)
	}

	return fetchOK(path).then(resolve)
}
