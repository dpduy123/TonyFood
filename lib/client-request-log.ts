export function logClientRequestFailure(
  request: string,
  status: number | null,
  error: unknown
) {
  console.error("Client request failed.", {
    request,
    status,
    error: error instanceof Error ? error.message : String(error),
  });
}
