// Resolve a human-readable message from an unknown thrown value
// without asserting its type.
export const describeError = (thrown: unknown): string => {
  const isError = thrown instanceof Error
  if (isError) return thrown.message
  return String(thrown)
}
