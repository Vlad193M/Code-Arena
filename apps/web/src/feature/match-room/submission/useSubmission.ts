import {
	type SubmissionResult,
	submissionResultSchema,
} from "@codearena/shared";
import { useCallback, useRef, useState } from "react";
import { apiClient } from "#/api/client";
import { toApiErrorMessage, toThrownErrorMessage } from "#/api/errors";

export type SubmissionView = {
	result: SubmissionResult | null;
	pending: boolean;
	error: string | undefined;
	submit: (code: string) => Promise<void>;
};

export function useSubmission(matchId: string): SubmissionView {
	const [result, setResult] = useState<SubmissionResult | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	/** `pending` only updates on the next render, so two quick clicks (or a
	 * click plus Ctrl+Enter) would both see `false`. The ref flips at once. */
	const inFlight = useRef(false);

	const submit = useCallback(
		async (code: string) => {
			if (inFlight.current) return;
			inFlight.current = true;
			setPending(true);
			setError(undefined);

			try {
				const { data, error: failure } = await apiClient.POST(
					"/api/matches/{id}/submissions",
					{ params: { path: { id: matchId } }, body: { code } },
				);
				if (failure) {
					setError(toApiErrorMessage(failure));
					return;
				}
				setResult(submissionResultSchema.parse(data));
			} catch (cause) {
				console.error("[submission] submit failed", cause);
				setError(toThrownErrorMessage(cause));
			} finally {
				inFlight.current = false;
				setPending(false);
			}
		},
		[matchId],
	);

	return { result, pending, error, submit };
}
