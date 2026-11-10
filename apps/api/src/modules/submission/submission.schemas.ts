import { z } from "zod";
import { MAX_CODE_LENGTH } from "../execution/execution.schemas";

/** Room for the judging wrapper appended before the engine checks the length. */
const WRAPPER_RESERVE = 1_000;

export const submitCodeSchema = z
	.object({
		code: z
			.string()
			.min(1)
			.max(MAX_CODE_LENGTH - WRAPPER_RESERVE)
			.meta({ example: "function twoSum(nums, target) { return [0, 1]; }" }),
	})
	.meta({ id: "SubmitCode" });
