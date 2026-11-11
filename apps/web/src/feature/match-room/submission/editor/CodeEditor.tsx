import Editor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";
import { CRT_THEME } from "./setupMonaco";

export type CodeEditorProps = {
	defaultValue: string;
	readOnly: boolean;
	onChange: (code: string) => void;
	onSubmit: () => void;
};

const OPTIONS: EditorProps["options"] = {
	fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
	fontSize: 14,
	lineHeight: 24,
	tabSize: 2,
	minimap: { enabled: false },
	scrollBeyondLastLine: false,
	automaticLayout: true,
	padding: { top: 12, bottom: 14 },
};

/** Loaded only through `LazyCodeEditor`: importing it pulls in all of Monaco. */
export default function CodeEditor({
	defaultValue,
	readOnly,
	onChange,
	onSubmit,
}: CodeEditorProps) {
	const onSubmitRef = useRef(onSubmit);
	useEffect(() => {
		onSubmitRef.current = onSubmit;
	});

	const options = useMemo(() => ({ ...OPTIONS, readOnly }), [readOnly]);

	const handleMount: OnMount = (editor, monaco) => {
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
			onSubmitRef.current(),
		);
	};

	return (
		<Editor
			height="420px"
			language="javascript"
			theme={CRT_THEME}
			defaultValue={defaultValue}
			onChange={(value) => onChange(value ?? "")}
			onMount={handleMount}
			options={options}
			loading={null}
		/>
	);
}
