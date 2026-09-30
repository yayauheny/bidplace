export function rethrowIfAbort(cause: unknown): void {
  if (cause instanceof Error && cause.name === 'AbortError') {
    throw cause;
  }
}
