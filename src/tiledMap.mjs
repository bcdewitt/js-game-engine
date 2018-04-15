import { createArray } from './utilities.mjs'

const defaultData = { tilesets: [], properties: {}, tileWidth: 0, tileHeight: 0 }
class TiledMap {
	constructor() {
		// New object, falling back to defaults
		this.data = Object.assign({}, defaultData)
		this.resources = new Map()
		this.basePath = ''
		this.tileTypes = []
		this.layers = new Map()
		this.layerCanvases = new Map()
		this.objects = {}
		this.startTime = null
	}

	get bgm() {
		return this.data.properties && this.data.properties.bgm
	}

	get bgmLoopTarget() {
		return this.data.properties && this.data.properties.bgmLoopTarget
	}

	get tileWidth() {
		return this.data.tilewidth
	}

	get tileHeight() {
		return this.data.tileheight
	}

	getObjects() {
		return this.objects
	}

	decorate(data) {
		this.data = Object.assign({}, defaultData, data)
		return this
	}

	setBasePath(basePath) {
		this.basePath = basePath
		return this
	}

	getRootRelativePath(path) {
		return (new URL(path, this.basePath)).href
	}

	getResourcePaths() {
		const { tilesets } = this.data

		// Get tile image paths
		const paths = tilesets.map(({ image }) => image)

		// Get BGM paths
		if (this.bgm) paths.push(this.bgm)

		return this.basePath ?
			paths.map(path => this.getRootRelativePath(path))
			: paths
	}

	getResource(path) {
		path = new URL(path, this.basePath).href
		return this.resources.get(path)
	}

	setResources(resources) {
		this.resources = new Map(resources)

		// Post-loading setup
		const { data } = this
		this.initTileTypes(data.tilesets)
		this.initLayers(data.layers)
		this.initLayerCanvases(this.tileWidth, this.tileHeight, this.tileTypes, this.layers)

		return this
	}

	initTileTypes(tilesets) {
		tilesets.forEach((tileset) => {
			const image = this.getResource(tileset.image)
			const yStep = tileset.tileheight + tileset.spacing
			const xStep = tileset.tilewidth + tileset.spacing
			const pixelsAcross = tileset.columns * tileset.tilewidth

			// Each loop, x and y represent the top left corner of each tile in the set
			for(let y = tileset.margin; this.tileTypes.length < tileset.tilecount; y += yStep) {
				for(let x = tileset.margin; x < pixelsAcross; x += xStep) {

					// Create base tile type object
					const obj = { image, x, y, width: tileset.tilewidth, height: tileset.tileheight }

					// Add animation data to the tile type object (if any)
					const extraData = tileset.tiles && tileset.tiles[this.tileTypes.length]
					if(extraData && extraData.animation) {
						let rangeStart = 0
						let rangeEnd = 0
						obj.animation = extraData.animation.map((step) => {
							rangeStart = rangeEnd
							rangeEnd = rangeStart + step.duration
							return { rangeStart, rangeEnd, tileid: step.tileid }
						})
					}

					// Add tile type to list
					this.tileTypes.push(obj)
				}
			}
		})
	}

	initLayers(layers) {

		// Handle tile layers
		const tileLayers = layers.filter(layer => layer.data && layer.type === 'tilelayer')
		this.layers = new Map(tileLayers.map((layer) => {
			const data = createArray(layer.width, layer.height)
			let idx = 0

			for(let y = 0, l = layer.height; y < l; y++) {
				for(let x = 0, l2 = layer.width; x < l2; x++) {
					data[x][y] = layer.data[idx++]
				}
			}

			return [ layer.name, { width: layer.width, height: layer.height, data } ]
		}))

		// Handle object layers
		const objectLayers = layers.filter(layer => layer.type === 'objectgroup')
		this.objects = objectLayers.reduce((objects, layer) => {
			layer.objects.forEach((objectData) => {

				// Grab base object properties
				const object = {
					width: objectData.width,
					height: objectData.height,
					x: objectData.x,
					y: objectData.y,
					type: objectData.type || layer.name,
					name: objectData.name
				}

				// Merge properties found in objectData.properties into base object
				Object.assign(object, objectData.properties)
				objects.push(object)
			})
			return objects
		}, [])
	}

	initLayerCanvases(tileWidth, tileHeight, tileTypes, layers) {
		layers = [...layers] // convert to array
		this.layerCanvases = new Map(
			layers.map(([layerName, layer]) => {
				let canvas = document.createElement('canvas')
				canvas.width = layer.width * tileWidth
				canvas.height = layer.height * tileHeight
				let context = canvas.getContext('2d')

				if (layer && layer.data) {
					for (let y = 0, l = layer.height; y < l; y++) {
						for (let x = 0, l2 = layer.width; x < l2; x++) {
							const tileType = tileTypes[layer.data[x][y] - 1]
							const posX = x * tileWidth
							const posY = y * tileHeight

							if (tileType && tileType.animation === undefined) {
								context.drawImage(tileType.image,
									tileType.x, tileType.y, tileType.width, tileType.height,
									posX, posY, tileWidth, tileHeight
								)
							}

						}
					}
				}

				return [ layerName, canvas ]
			})
		)
	}

	renderAnimatedTiles(context, layerName, time, tileX1, tileY1, tileX2, tileY2, dX, dY, scaleW, scaleH) {
		const layer = this.layers.get(layerName)

		if (!layer) return

		// Adjust values to ensure we are operating within the layer boundaries
		tileY1 = Math.max(tileY1, 0)
		tileY2 = Math.min(tileY2, layer.height)
		tileX1 = Math.max(tileX1, 0)
		tileX2 = Math.min(tileX2, layer.width)

		// Loop through each tile within the area specified in tileX1, Y1, X2, Y2
		for (let y = tileY1; y < tileY2; y++) {
			for (let x = tileX1; x < tileX2; x++) {
				const tileIdx = layer.data[x][y]
				if (tileIdx === 0) continue

				const posX = (x * this.tileWidth) + dX
				const posY = (y * this.tileHeight) + dY

				// If the tile is animated, determine the tile type to be used at this point in time
				let tileType = this.tileTypes[tileIdx - 1]
				if (tileType.animation) {
					const wrappedTime = time % tileType.animation[tileType.animation.length - 1].rangeEnd
					for (let step of tileType.animation) {
						if (wrappedTime > step.rangeStart && wrappedTime < step.rangeEnd) {
							tileType = this.tileTypes[step.tileid]
							break
						}
					}

					context.drawImage(
						tileType.img,
						tileType.x,
						tileType.y,
						tileType.width,
						tileType.height,
						posX,
						posY,
						this.tileWidth * scaleW,
						this.tileHeight * scaleH
					)

				}
			}
		}

	}

	render(context, layerName, timestamp, sX, sY, sW, sH, dX, dY, dW, dH) {
		// NOTE: May need to use context.getImageData() and .putImageData() for transparency support instead of .drawImage()
		// ...I tried these but they created memory leaks when debugging with Chrome

		this.startTime = this.startTime || timestamp

		const canvas = this.layerCanvases.get(layerName)

		if (canvas) {

			// Draw static parts of layer
			context.drawImage(canvas, sX, sY, sW, sH, dX, dY, dW, dH)

			// Draw animated parts of layer
			this.renderAnimatedTiles(
				context,
				layerName,
				(timestamp - this.startTime),         // get time since first render (for animation)
				parseInt(sX / this.tileWidth),        // calc x1 in tile units
				parseInt(sY / this.tileHeight),       // calc y1 in tile units
				parseInt(sX + sW) / this.tileWidth,   // calc x2 in tile units
				parseInt(sY + sH) / this.tileHeight,  // calc y2 in tile units
				dX, dY, dW / sW, dH / sH              // destination x, y, scaling-x, scaling-y
			)

		}

	}
}

export default TiledMap
