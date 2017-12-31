import includePaths from 'rollup-plugin-includepaths'

const includePathOptions = {
	include: {},
	paths: ['node_modules'],
	external: [],
	extensions: ['.mjs']
}

export default {
	input: 'public/js/index.mjs',
	output: {
		file: 'public/js/index.js',
		format: 'iife'
	},
	plugins: [ includePaths(includePathOptions) ],
}
