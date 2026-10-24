import type { Difficulty } from "@codearena/shared";

/** `signature` and test case data are `unknown` on purpose: the seed validates
 * them at runtime, exactly as anything read back from the JSON columns must be. */
export interface SeedProblem {
	slug: string;
	title: string;
	difficulty: Difficulty;
	statement: string;
	timeLimitMs: number;
	memoryLimitMb: number;
	signature: unknown;
	testCases: { isHidden: boolean; input: unknown; expectedOutput: unknown }[];
}

export const seedProblems: SeedProblem[] = [
	{
		slug: "two-sum",
		title: "Two Sum",
		difficulty: "EASY",
		statement: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

Each input has exactly one solution, and you may not use the same element twice. Return the two indices in increasing order.

### Constraints
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i], target ≤ 10⁹`,
		timeLimitMs: 1000,
		memoryLimitMb: 128,
		signature: {
			functionName: "twoSum",
			params: [
				{ name: "nums", type: "int[]" },
				{ name: "target", type: "int" },
			],
			returnType: "int[]",
		},
		testCases: [
			{ isHidden: false, input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
			{ isHidden: false, input: [[3, 2, 4], 6], expectedOutput: [1, 2] },
			{ isHidden: true, input: [[3, 3], 6], expectedOutput: [0, 1] },
			{ isHidden: true, input: [[-1, -2, -3, -4, -5], -8], expectedOutput: [2, 4] },
			{ isHidden: true, input: [[0, 4, 3, 0], 0], expectedOutput: [0, 3] },
			{ isHidden: true, input: [[1, 5, 9, 13, 2], 15], expectedOutput: [3, 4] },
		],
	},
	{
		slug: "valid-palindrome",
		title: "Valid Palindrome",
		difficulty: "EASY",
		statement: `Given a string \`s\`, return \`true\` if it is a palindrome after converting all uppercase letters to lowercase and removing every non-alphanumeric character, and \`false\` otherwise.

An empty string after cleanup counts as a palindrome.

### Constraints
- 1 ≤ s.length ≤ 2 · 10⁵
- \`s\` consists of printable ASCII characters`,
		timeLimitMs: 1000,
		memoryLimitMb: 128,
		signature: {
			functionName: "isPalindrome",
			params: [{ name: "s", type: "string" }],
			returnType: "bool",
		},
		testCases: [
			{ isHidden: false, input: ["A man, a plan, a canal: Panama"], expectedOutput: true },
			{ isHidden: false, input: ["race a car"], expectedOutput: false },
			{ isHidden: true, input: [" "], expectedOutput: true },
			{ isHidden: true, input: ["0P"], expectedOutput: false },
			{ isHidden: true, input: ["ab_a"], expectedOutput: true },
			{ isHidden: true, input: ["Was it a car or a cat I saw?"], expectedOutput: true },
		],
	},
	{
		slug: "maximum-subarray",
		title: "Maximum Subarray",
		difficulty: "MEDIUM",
		statement: `Given an integer array \`nums\`, find the contiguous non-empty subarray with the largest sum and return that sum.

### Constraints
- 1 ≤ nums.length ≤ 10⁵
- -10⁴ ≤ nums[i] ≤ 10⁴`,
		timeLimitMs: 1000,
		memoryLimitMb: 128,
		signature: {
			functionName: "maxSubArray",
			params: [{ name: "nums", type: "int[]" }],
			returnType: "int",
		},
		testCases: [
			{ isHidden: false, input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expectedOutput: 6 },
			{ isHidden: false, input: [[1]], expectedOutput: 1 },
			{ isHidden: true, input: [[5, 4, -1, 7, 8]], expectedOutput: 23 },
			{ isHidden: true, input: [[-3, -1, -2]], expectedOutput: -1 },
			{ isHidden: true, input: [[-2, -3, 4, -1, -2, 1, 5, -3]], expectedOutput: 7 },
		],
	},
	{
		slug: "number-of-islands",
		title: "Number of Islands",
		difficulty: "MEDIUM",
		statement: `Given an \`m × n\` grid where \`1\` is land and \`0\` is water, return the number of islands.

An island is a group of land cells connected horizontally or vertically (not diagonally). Everything outside the grid is water.

### Constraints
- 1 ≤ m, n ≤ 300
- grid[i][j] is \`0\` or \`1\``,
		timeLimitMs: 1000,
		memoryLimitMb: 128,
		signature: {
			functionName: "numIslands",
			params: [{ name: "grid", type: "int[][]" }],
			returnType: "int",
		},
		testCases: [
			{
				isHidden: false,
				input: [
					[
						[1, 1, 1, 1, 0],
						[1, 1, 0, 1, 0],
						[1, 1, 0, 0, 0],
						[0, 0, 0, 0, 0],
					],
				],
				expectedOutput: 1,
			},
			{
				isHidden: false,
				input: [
					[
						[1, 1, 0, 0, 0],
						[1, 1, 0, 0, 0],
						[0, 0, 1, 0, 0],
						[0, 0, 0, 1, 1],
					],
				],
				expectedOutput: 3,
			},
			{ isHidden: true, input: [[[0]]], expectedOutput: 0 },
			{
				isHidden: true,
				input: [
					[
						[1, 0, 1],
						[0, 1, 0],
						[1, 0, 1],
					],
				],
				expectedOutput: 5,
			},
			{
				isHidden: true,
				input: [
					[
						[1, 1, 1],
						[0, 1, 0],
						[1, 1, 1],
					],
				],
				expectedOutput: 1,
			},
		],
	},
	{
		slug: "trapping-rain-water",
		title: "Trapping Rain Water",
		difficulty: "HARD",
		statement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, return how much water it can trap after raining.

### Constraints
- 1 ≤ n ≤ 2 · 10⁴
- 0 ≤ height[i] ≤ 10⁵`,
		timeLimitMs: 1000,
		memoryLimitMb: 128,
		signature: {
			functionName: "trap",
			params: [{ name: "height", type: "int[]" }],
			returnType: "int",
		},
		testCases: [
			{ isHidden: false, input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expectedOutput: 6 },
			{ isHidden: false, input: [[4, 2, 0, 3, 2, 5]], expectedOutput: 9 },
			{ isHidden: true, input: [[5]], expectedOutput: 0 },
			{ isHidden: true, input: [[1, 2, 3, 4]], expectedOutput: 0 },
			{ isHidden: true, input: [[5, 0, 5]], expectedOutput: 5 },
			{ isHidden: true, input: [[3, 0, 0, 2, 0, 4]], expectedOutput: 10 },
		],
	},
];
