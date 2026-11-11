import type { ProblemSignature, ValueType } from "@codearena/shared";

const JSDOC_TYPE: Record<ValueType, string> = {
	int: "number",
	float: "number",
	string: "string",
	bool: "boolean",
	"int[]": "number[]",
	"string[]": "string[]",
	"int[][]": "number[][]",
};

/** The JSDoc types let the editor suggest, say, array methods on `nums.`. */
export function starterCode({
	functionName,
	params,
	returnType,
}: ProblemSignature): string {
	return [
		"/**",
		...params.map(
			({ name, type }) => ` * @param {${JSDOC_TYPE[type]}} ${name}`,
		),
		` * @returns {${JSDOC_TYPE[returnType]}}`,
		" */",
		`function ${functionName}(${params.map(({ name }) => name).join(", ")}) {`,
		"  ",
		"}",
		"",
	].join("\n");
}
