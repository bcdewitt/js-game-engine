const _x = Symbol('_x')
const _y = Symbol('_y')
const _width = Symbol('_width')
const _height = Symbol('_height')

export default class SpriteComponent {
	constructor(x, y, width, height, frame, layer) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
		this.frame = frame
		this.layer = layer
		this.flipped = false
	}
	get x() {
		return this[_x]
	}
	set x(val) {
		this[_x] = val
		this.midPointX = val + this.halfWidth
	}

	get y() {
		return this[_y]
	}
	set y(val) {
		this[_y] = val
		this.midPointY = val + this.halfHeight
	}

	get width() {
		return this[_width]
	}
	set width(val) {
		this[_width] = val
		this.halfWidth = val / 2
		this.midPointX = this.x + this.halfWidth
	}

	get height() {
		return this[_height]
	}
	set height(val) {
		this[_height] = val
		this.halfHeight = val / 2
		this.midPointY = this.y + this.halfHeight
	}
}
