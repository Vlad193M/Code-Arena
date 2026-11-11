import { CatchBoundary } from "@tanstack/react-router";
import { lazy, type ReactNode, Suspense } from "react";
import LoadingText from "#/ui/LoadingText";
import type { CodeEditorProps } from "./CodeEditor";

const CodeEditor = lazy(() => import("./CodeEditor"));

function EditorBox({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-[420px] flex-col items-center justify-center gap-4 bg-(--crt-ink) px-4 text-center text-sm tracking-[0.05em] text-(--crt-dim)">
			{children}
		</div>
	);
}

/** `lazy` remembers a failed import, so only a reload recovers. */
function EditorFailed() {
	return (
		<EditorBox>
			<span className="crt-glow-red text-(--crt-red)">
				{"> "}EDITOR STOPPED WORKING
			</span>
			<span className="text-xs">Your code is saved — reloading keeps it.</span>
			<button
				type="button"
				onClick={() => window.location.reload()}
				className="min-h-11 cursor-pointer border border-(--crt-amber) bg-transparent px-5 font-[inherit] text-[13px] tracking-[0.1em] text-(--crt-amber) hover:bg-(--crt-amber)/10"
			>
				[ RELOAD ]
			</button>
		</EditorBox>
	);
}

export default function LazyCodeEditor(props: CodeEditorProps) {
	return (
		<CatchBoundary
			getResetKey={() => "code-editor"}
			errorComponent={EditorFailed}
			onCatch={(error) => console.error("[editor] failed", error)}
		>
			<Suspense
				fallback={
					<EditorBox>
						<LoadingText label="LOADING EDITOR" />
					</EditorBox>
				}
			>
				<CodeEditor {...props} />
			</Suspense>
		</CatchBoundary>
	);
}
