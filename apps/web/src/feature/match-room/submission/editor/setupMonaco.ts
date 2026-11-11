import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker?worker";

export const CRT_THEME = "crt";

/** Monaco's own worker lookup breaks under Vite for the base editor worker,
 * so both workers are handed over as Vite-bundled `?worker` imports. */
globalThis.MonacoEnvironment = {
	getWorker(_workerId, label) {
		return label === "javascript" || label === "typescript"
			? new TypeScriptWorker()
			: new EditorWorker();
	},
};

monaco.editor.defineTheme(CRT_THEME, {
	base: "vs-dark",
	inherit: true,
	rules: [
		{ token: "keyword", foreground: "c792ea" },
		{ token: "string", foreground: "c3e88d" },
		{ token: "number", foreground: "f78c6c" },
		{ token: "regexp", foreground: "f78c6c" },
		{ token: "comment", foreground: "6f6a5c", fontStyle: "italic" },
		{ token: "type.identifier", foreground: "ffcb6b" },
		{ token: "delimiter", foreground: "89ddff" },
		{ token: "identifier", foreground: "e4e0d6" },
	],
	colors: {
		"editor.background": "#14130f",
		"editor.foreground": "#e4e0d6",
		"editorLineNumber.foreground": "#7a5c38",
		"editorLineNumber.activeForeground": "#ffb000",
		"editorCursor.foreground": "#e4e0d6",
		"editor.selectionBackground": "#ffb00033",
		"editor.lineHighlightBackground": "#ffb0000a",
	},
});

/** Without this, `@monaco-editor/react` downloads Monaco from a CDN. */
loader.config({ monaco });
