const _entity = Symbol('_x')
const _spriteComp = Symbol('_x')

export default class SpritePhysicsComponent {
	constructor(entity) {
		this[_entity] = entity
		this.accX = 0
		this.accY = 0
		this.spdX = 0
		this.spdY = 0
	}
	get [_spriteComp]() { return this[_entity].getComponent('sprite') }
	get x() { return this[_spriteComp].x }
	set x(val) { this[_spriteComp].x = val }
	get y() { return this[_spriteComp].y }
	set y(val) { this[_spriteComp].y = val }
	get width() { return this[_spriteComp].width }
	set width(val) { this[_spriteComp].width = val }
	get height() { return this[_spriteComp].height }
	set height(val) { this[_spriteComp].height = val }
	get midPointX() { return this[_spriteComp].midPointX }
	set midPointX(val) { this[_spriteComp].midPointX = val }
	get midPointY() { return this[_spriteComp].midPointY }
	set midPointY(val) { this[_spriteComp].midPointY = val }
	get halfWidth() { return this[_spriteComp].halfWidth }
	set halfWidth(val) { this[_spriteComp].halfWidth = val }
	get halfHeight() { return this[_spriteComp].halfHeight }
	set halfHeight(val) { this[_spriteComp].halfHeight = val }
}
