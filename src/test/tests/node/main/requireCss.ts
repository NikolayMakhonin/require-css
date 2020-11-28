import {requireCss} from '../../../../main/node/requireCss'

/* eslint-disable no-new-func */
describe('node', function () {
	it('requireCss', function () {
		const cssJs = requireCss('./assets/test.css')
		assert.deepStrictEqual(
			cssJs,
			[
				'@at-rule-wiwhout-params',
				'@at-rule with params',
				'@at-rule (with params)',
				'// comment',
				{
					'.selector1': {
						color: '#0f0',
					},
					'.selector2': {
						color: '#0f0',
					},
				},
				'// another comment',
				{
					'@at-rule (with params)': {
						'and-content': 'value',
					},
					'.selector3': {
						color          : '#0f0',
						'.sub-selector': {
							content: '"quotes is required for this CSS property"',
						},
					},
				},
			],
		)
	})
})
