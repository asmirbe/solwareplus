/**
 * ESLint configuration for the project.
 *
 * See https://eslint.style and https://typescript-eslint.io for additional linting options.
 */
// @ts-check
const js = require("@eslint/js");

module.exports = [
	{
		ignores: [".vscode-test", "out"],
	},
	js.configs.recommended,
	{
		rules: {
			curly: "warn",
			"no-unused-vars": "warn",
		},
	},
];
