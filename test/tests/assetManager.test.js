/* globals AssetManager */

const TIMEOUT = 5000

// Shared assertions
const checkIsDone = ({
	isDoneBefore,
	isDoneAfterQueue,
	isDoneAfterDownload
}) => {
	expect(isDoneBefore).toEqual(true)
	expect(isDoneAfterQueue).toEqual(false)
	expect(isDoneAfterDownload).toEqual(true)
}

describe('AssetManager', () => {

	// Set up testing environment
	let page
	let singleDownloadHandle
	const testObj = require('../files/test.json')

	beforeAll(async () => {
		page = await global.__BROWSER__.newPage()

		// This page has a module script that imports
		// and exposes the class specified in the url as window.AssetManager
		await page.goto('http://localhost/class/AssetManager')

		// Reused function for each single download test
		// (Need a handle because it must exist inside the browser)
		singleDownloadHandle = await page.evaluateHandle(() => (fileName) => {
			const a = new AssetManager()
			const isDoneBefore = a.isDone()
			a.queueDownload(fileName)
			const isDoneAfterQueue = a.isDone()
			return new Promise(function(resolve, reject) {
				try {
					a.downloadAll(() => resolve({
						isDoneBefore,
						isDoneAfterQueue,
						isDoneAfterDownload: a.isDone(),
						asset: a.getAsset(fileName),
					}))
				} catch(e) {
					reject(e)
				}
			})
		})
	}, TIMEOUT)


	// Test AssetManager Image file downloading
	it('Should download JPG image file', async () => {
		const results = await page.evaluate(
			singleDownload => singleDownload('test.jpg'),
			singleDownloadHandle
		)
		checkIsDone(results)
		expect(results.asset).toEqual(expect.anything())
	})


	// Test AssetManager Audio file downloading
	it('Should download MP3 audio file', async () => {
		const results = await page.evaluate(
			singleDownload => singleDownload('test.mp3'),
			singleDownloadHandle
		)
		checkIsDone(results)
		expect(results.asset).toEqual(expect.anything())
	})


	// Test AssetManager Video file downloading
	it('Should download MP4 video file', async () => {
		const results = await page.evaluate(
			singleDownload => singleDownload('test.mp4'),
			singleDownloadHandle
		)
		checkIsDone(results)
		expect(results.asset).toEqual(expect.anything())
	})


	// Test AssetManager JSON file downloading
	it('Should download JSON data file', async () => {
		const results = await page.evaluate(
			singleDownload => singleDownload('test.json'),
			singleDownloadHandle
		)
		checkIsDone(results)
		expect(results.asset).toMatchObject(testObj)
	})


	// Test multiple file downloading
	it('Should download multiple files', async () => {
		const results = await page.evaluate(() => {
			const fileNameArr = [
				'test.jpg',
				'test.mp3',
				'test.mp4',
				'test.json',
			]
			const a = new AssetManager()
			const isDoneBefore = a.isDone()
			a.queueDownloads(fileNameArr)
			const isDoneAfterQueue = a.isDone()
			return new Promise(function(resolve, reject) {
				try {
					a.downloadAll(() => {
						resolve({
							isDoneBefore,
							isDoneAfterQueue,
							isDoneAfterDownload: a.isDone(),
							assets: fileNameArr.map(fileName => a.getAsset(fileName)),
						})
					})
				} catch(e) {
					reject(e)
				}
			})
		})

		checkIsDone(results)
		expect(results.assets).toHaveLength(4)
		expect(results.assets[3]).toMatchObject(testObj)
	})


	// Test Edge case
	it('Should fail gracefully with a warning when failing to download', (done) => {
		page.on('console', msg => {
			expect(msg.text).toEqual(expect.any(String))
			done()
		})
		page.evaluate(
			singleDownload => singleDownload('non-existant-file.json'),
			singleDownloadHandle
		)
	})
}, TIMEOUT)
