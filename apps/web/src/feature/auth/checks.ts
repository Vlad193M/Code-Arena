import type { TerminalCheck } from "#/ui/TerminalChecks";

export function check(
  ok: boolean,
  okText: string,
  badText: string,
): TerminalCheck {
  return { ok, text: ok ? okText : badText };
}

/**
 * An untouched field stays silent so the form does not greet a visitor with
 * red text; once a submit was attempted, it has to say what is missing.
 */
export function missing(label: string): Array<TerminalCheck> {
  return [{ ok: false, text: `${label} is required` }];
}
