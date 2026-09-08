import type { LobbyMatch } from "@codearena/shared";
import { assertNever } from "#/lib/assertNever";

export type LobbyAction =
  | { type: "snapshot"; matches: LobbyMatch[] }
  | { type: "created"; match: LobbyMatch }
  | { type: "removed"; id: string };

export function lobbyReducer(
  state: LobbyMatch[],
  action: LobbyAction,
): LobbyMatch[] {
  switch (action.type) {
    case "snapshot": {
      return action.matches;
    }

    case "created": {
      const { match } = action;
      const exists = state.some((item) => item.id === match.id);

      return exists
        ? state.map((item) => (item.id === match.id ? match : item))
        : [match, ...state];
    }

    case "removed": {
      const remaining = state.filter((item) => item.id !== action.id);

      return remaining.length === state.length ? state : remaining;
    }

    default: {
      return assertNever(action);
    }
  }
}
