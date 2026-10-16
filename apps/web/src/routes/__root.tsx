import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	type ErrorComponentProps,
	HeadContent,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { toThrownErrorMessage } from "#/api/errors";
import { startSocketBridge } from "#/api/socket";
import { useRecheckOnSessionEnd } from "#/feature/auth/useRecheckOnSessionEnd";
import TerminalAlert from "#/ui/TerminalAlert";
import TerminalButton from "#/ui/TerminalButton";
import TerminalFrame from "#/ui/TerminalFrame";
import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	errorComponent: RootErrorScreen,
});

function RootErrorScreen({ error }: ErrorComponentProps) {
	const router = useRouter();

	useEffect(() => {
		console.error("[root] uncaught route error", error);
	}, [error]);

	return (
		<TerminalFrame
			title="SIGNAL LOST"
			description="This page could not be loaded."
			footerTag="ERROR"
			prompt="route --reload"
		>
			<div className="flex flex-col gap-4">
				<TerminalAlert tone="error">
					{toThrownErrorMessage(error)}
				</TerminalAlert>
				<TerminalButton
					type="button"
					label="RETRY"
					onClick={() => router.invalidate()}
				/>
			</div>
		</TerminalFrame>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	useRecheckOnSessionEnd();

	useEffect(() => {
		startSocketBridge();
	}, []);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a static constant, no user input */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
