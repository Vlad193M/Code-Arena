import {
	MAX_ERROR_LENGTH,
	MAX_STDOUT_LENGTH,
	OUTPUT_LIMIT_ERROR,
} from "./execution.schemas.ts";

/**
 * Globals user code keeps; every other global is deleted, including any a
 * future V8 adds. Left out on purpose: `Intl`, `SharedArrayBuffer`, `Atomics`,
 * and `WebAssembly`, whose memory isolated-vm does not count against the
 * isolate's limit.
 */
export const ALLOWED_GLOBALS = [
	"AggregateError",
	"Array",
	"ArrayBuffer",
	"AsyncDisposableStack",
	"BigInt",
	"BigInt64Array",
	"BigUint64Array",
	"Boolean",
	"DataView",
	"Date",
	"DisposableStack",
	"Error",
	"EvalError",
	"FinalizationRegistry",
	"Float16Array",
	"Float32Array",
	"Float64Array",
	"Function",
	"Infinity",
	"Int16Array",
	"Int32Array",
	"Int8Array",
	"Iterator",
	"JSON",
	"Map",
	"Math",
	"NaN",
	"Number",
	"Object",
	"Promise",
	"Proxy",
	"RangeError",
	"ReferenceError",
	"Reflect",
	"RegExp",
	"Set",
	"String",
	"SuppressedError",
	"Symbol",
	"SyntaxError",
	"TypeError",
	"URIError",
	"Uint16Array",
	"Uint32Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"WeakMap",
	"WeakRef",
	"WeakSet",
	"__stdin",
	"console",
	"decodeURI",
	"decodeURIComponent",
	"encodeURI",
	"encodeURIComponent",
	"escape",
	"eval",
	"globalThis",
	"isFinite",
	"isNaN",
	"parseFloat",
	"parseInt",
	"undefined",
	"unescape",
];

/**
 * Runs in the isolate before user code and returns the function that runs it.
 *
 * Only short strings built in here, under the time limit, cross back to the
 * host: copying a thrown object out would run its getters on the host, where
 * no time limit applies, and a huge string would fill the runner's heap.
 *
 * The removed prototype methods allocate memory that is not counted against
 * the isolate's memory limit.
 */
export const BOOTSTRAP = `(() => {
	const write = globalThis.__write;
	const allowed = new Set(${JSON.stringify(ALLOWED_GLOBALS)});
	for (const name of Object.getOwnPropertyNames(globalThis)) {
		if (!allowed.has(name)) delete globalThis[name];
	}
	delete Date.prototype.toLocaleString;
	delete Date.prototype.toLocaleDateString;
	delete Date.prototype.toLocaleTimeString;
	delete ArrayBuffer.prototype.resize;
	delete ArrayBuffer.prototype.transfer;
	delete ArrayBuffer.prototype.transferToFixedLength;

	const evaluate = eval;
	const toText = String;
	const Failure = Error;
	const slice = Function.prototype.call.bind(String.prototype.slice);
	const cut = (text, length) => (text.length > length ? slice(text, 0, length) : text);
	const format = (args) => {
		let line = "";
		for (let i = 0; i < args.length; i++) line += (i > 0 ? " " : "") + toText(args[i]);
		return line;
	};
	const log = (...args) => {
		if (!write(cut(format(args), ${MAX_STDOUT_LENGTH + 1}))) {
			throw new Failure(${JSON.stringify(OUTPUT_LIMIT_ERROR)});
		}
	};
	globalThis.console = { log, info: log, debug: log, warn: log, error: log };

	const describe = (error) => {
		try {
			return error instanceof Error
				? toText(error.name) + ": " + toText(error.message)
				: "Uncaught " + toText(error);
		} catch {
			return "Uncaught exception";
		}
	};

	return (code) => {
		try {
			evaluate(code);
			return null;
		} catch (error) {
			return cut(describe(error), ${MAX_ERROR_LENGTH});
		}
	};
})()`;
