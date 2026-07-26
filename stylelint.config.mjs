export default {
	extends: ["stylelint-config-standard"],
	rules: {
		"color-no-hex": true,
		"declaration-no-important": true,
		"no-descending-specificity": null,
		"selector-class-pattern": null,
	},
	overrides: [
		{
			files: ["src/styles/tokens.css"],
			rules: { "color-no-hex": null },
		},
	],
};
