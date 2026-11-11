export default function LoadingText({ label }: { label: string }) {
	return (
		<>
			{label}
			<span className="crt-ellipsis" />
		</>
	);
}
