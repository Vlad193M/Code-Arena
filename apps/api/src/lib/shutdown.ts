const FORCED_EXIT_MS = 5_000;

let closing = false;

/** Exits either way: a hung release step must not keep an untrustworthy
 * process alive. */
async function shutdown(close: () => Promise<void>): Promise<void> {
  if (closing) return;
  closing = true;

  setTimeout(() => process.exit(1), FORCED_EXIT_MS);

  try {
    await close();
  } catch (error) {
    console.error("❌ Shutdown failed:", error);
  }

  process.exit(1);
}

/**
 * A net, not a strategy: known async work belongs in `onSafe` or the error
 * middleware, which recover without dropping every open connection. Reaching
 * here means an unknown path failed and the process state can no longer be
 * trusted, so it exits for the supervisor to restart it clean.
 */
export function installCrashHandlers(close: () => Promise<void>): void {
  const crash = (label: string) => (reason: unknown) => {
    console.error(`💥 ${label} — shutting down:`, reason);
    void shutdown(close);
  };

  process.on("unhandledRejection", crash("Unhandled rejection"));
  process.on("uncaughtException", crash("Uncaught exception"));
}
