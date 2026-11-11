import type { ProblemSignature } from "@codearena/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { starterCode } from "./starterCode";

const draftPrefix = (userId: string) => `codearena:draft:${userId}:`;
const draftKey = (userId: string, matchId: string) =>
	`${draftPrefix(userId)}${matchId}`;

/** Storage can be blocked; a lost draft only means starting from scratch. */
function readDraft(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeDraft(key: string, code: string) {
	try {
		localStorage.setItem(key, code);
	} catch {}
}

function dropDraftsExcept(userId: string, keep: string) {
	try {
		const stale = Object.keys(localStorage).filter(
			(key) => key.startsWith(draftPrefix(userId)) && key !== keep,
		);
		for (const key of stale) localStorage.removeItem(key);
	} catch {}
}

/** Only a live match clears other drafts: a player has one at a time. */
export function useDraftCode(
	matchId: string,
	userId: string,
	signature: ProblemSignature,
	live: boolean,
) {
	const key = draftKey(userId, matchId);
	const [initial] = useState(() => readDraft(key) ?? starterCode(signature));
	const code = useRef(initial);

	useEffect(() => {
		if (live) dropDraftsExcept(userId, key);
	}, [live, userId, key]);

	const update = useCallback(
		(next: string) => {
			code.current = next;
			writeDraft(key, next);
		},
		[key],
	);

	return { initial, code, update };
}
