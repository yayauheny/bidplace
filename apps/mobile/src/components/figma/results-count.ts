export function resultsCountLabel(count: number) {
  return `Показать ${count} работ`;
}

export function resultsCountUsesLotCopy(label: string) {
  return /лот/i.test(label);
}
