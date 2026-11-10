import { RESULT_MARKER } from "./submission.judge";

/** Appends the call that judging needs. The newline ends a trailing `//`
 * comment; the semicolon ends a statement left without one. */
export function wrapJavaScript(code: string, functionName: string): string {
	return `${code}
;console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(${functionName}(...JSON.parse(__stdin))));
`;
}
