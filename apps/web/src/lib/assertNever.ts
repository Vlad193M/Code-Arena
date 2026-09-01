/**
 * Compile-time exhaustiveness guard: the call only typechecks while every
 * variant of a union is already handled, so a new one breaks the build here
 * instead of being silently ignored at runtime.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}
