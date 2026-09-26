export function authorWorksArePending(input: {
  isLoading: boolean;
  isPlaceholderData: boolean;
}) {
  return input.isLoading || input.isPlaceholderData;
}
