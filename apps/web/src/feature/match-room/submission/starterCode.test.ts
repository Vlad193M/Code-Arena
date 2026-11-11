import { describe, expect, it } from "vitest";
import { starterCode } from "./starterCode";

describe("starterCode", () => {
	it("declares the signature's function with JSDoc types", () => {
		const code = starterCode({
			functionName: "twoSum",
			params: [
				{ name: "nums", type: "int[]" },
				{ name: "target", type: "int" },
			],
			returnType: "int[]",
		});

		expect(code).toBe(
			[
				"/**",
				" * @param {number[]} nums",
				" * @param {number} target",
				" * @returns {number[]}",
				" */",
				"function twoSum(nums, target) {",
				"  ",
				"}",
				"",
			].join("\n"),
		);
	});
});
