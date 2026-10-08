export function registrationStillOwns({
  mounted,
  operation,
  currentOperation,
  epoch,
  currentEpoch,
  userId,
  sessionUserId,
}: {
  mounted: boolean;
  operation: number;
  currentOperation: number;
  epoch: number;
  currentEpoch: number;
  userId: string | null;
  sessionUserId: string | null;
}): boolean {
  return (
    mounted &&
    operation === currentOperation &&
    epoch === currentEpoch &&
    sessionUserId === userId
  );
}
