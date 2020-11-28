import fs from 'fs'
import path from 'path'
import resolveFrom from 'resolve-from'
import caller from 'caller'
import postcss from 'postcss'
import postcssJsSyntax from 'postcss-js-syntax'

const postcssInstance = postcss([])

function cssToJs(content: string, filename: string) {
	const stringified = postcssInstance.process(content, {
		stringifier(code, builder) {
			try {
				return postcssJsSyntax.stringify(code, builder)
			} catch (ex) {
				console.error(ex)
				throw ex
			}
		},
		from: filename,
	}).css

	return JSON.parse(stringified)
}

function cssFileToJs(filename: string) {
	const content = fs.readFileSync(filename, 'utf-8')
	return cssToJs(content, filename)
}

export function requireCss(id: string) {
	const callerPath = path.dirname(caller())
	const filepath = resolveFrom(callerPath, id)
	return cssFileToJs(filepath)
}
