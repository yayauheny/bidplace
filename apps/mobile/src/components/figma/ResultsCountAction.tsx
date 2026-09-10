import { FigmaButton } from './FigmaButton';
import { resultsCountLabel } from './results-count';

export function ResultsCountAction({
  count,
  onPress,
  label,
}: {
  count: number;
  onPress: () => void;
  label?: string;
}) {
  const resolved = label ?? resultsCountLabel(count);

  return (
    <FigmaButton
      label={resolved}
      variant="solid"
      width="full"
      onPress={onPress}
    />
  );
}
