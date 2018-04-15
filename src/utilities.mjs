const ADD_PROPS_METHOD_NAME = 'construct'

// Creates a function that "extracts" an object with only the properties that test true
const createExtractObjFunc = test => obj => {
	const extractedObj = {}
	Object.entries(obj).forEach(([key, val]) => {
		if (test(val, key)) extractedObj[key] = val
	})
	return extractedObj
}

// Extracts an object with only the non-function properties
const extractConstructor = createExtractObjFunc((val, key) => key === ADD_PROPS_METHOD_NAME)

// Extracts an object with only the function properties (methods)
const extractMethods = createExtractObjFunc((val, key) => key !== ADD_PROPS_METHOD_NAME)

// Creates an extendable class that includes the provided mixins
const createMixinFunc = (Clazz) => (...mixins) => {
	const constructors = mixins.map(mixin => extractConstructor(mixin).construct)
	const methodsMixins = mixins.map(mixin => extractMethods(mixin))

	// Add properties to class constructor
	let Mixable
	if (Clazz)
		Mixable = class extends Clazz {
			constructor(...args) {
				super(...args)
				constructors.forEach(construct => construct.call(this))
			}
		}
	else
		Mixable = class {
			constructor() {
				constructors.forEach(construct => construct.call(this))
			}
		}

	// Add methods to class prototype
	Object.assign(Mixable.prototype, ...methodsMixins)

	return Mixable
}

const MixedWith = createMixinFunc()

// Creates nested empty arrays
const createArray = (...args) => {
	if (args.length === 0) return []

	const length = args[0]

	const arr = new Array(length)

	let i = length
	if (args.length > 1) {
		while(i--) arr[length-1 - i] = createArray(...(args.slice(1)))
	}

	return arr
}


export { createMixinFunc, createArray, MixedWith }
