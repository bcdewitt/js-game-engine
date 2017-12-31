const _entity = Symbol('_entity')
const _spriteComp = Symbol('_spriteComp')
const _x = Symbol('_x')
const _y = Symbol('_y')
const _followSprite = Symbol('_followSprite')
const gainNodeMap = new WeakMap()

export default class SpriteSoundComponent {
	constructor(src, entity) {
		this[_entity] = entity
		this.src = src
		this.play = false
		this.volume = 1
		this[_followSprite] = true
	}
	get [_spriteComp]() { return this[_entity].getComponent('sprite') }
	get followSprite() { return this[_followSprite] }
	set followSprite(val) {
		if(this[_followSprite] && !val) {
			this.x = this[_spriteComp].midPointX
			this.y = this[_spriteComp].midPointY
		}
		this[_followSprite] = val
	}
	get x() { return this.followSprite ? this[_spriteComp].midPointX : this[_x] }
	set x(val) { this[_x] = val }
	get y() { return this.followSprite ? this[_spriteComp].midPointY : this[_y] }
	set y(val) { this[_y] = val }
	set gainNode(val) {
		gainNodeMap.set(this, val)
	}
	get gainNode() {
		return gainNodeMap.get(this)
	}
}
