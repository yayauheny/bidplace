const ALLOWED_REFUSAL = new Set(['BID_TOO_LOW', 'conflict']);

export function assertDisposableTarget(target) {
  const api = new URL(target.baseUrl);
  const database = new URL(target.databaseUrl);
  if (!['127.0.0.1', 'localhost'].includes(api.hostname)) {
    throw new Error('Refusing a non-loopback API URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(database.hostname)) {
    throw new Error('Refusing a non-loopback database URL');
  }
  if (database.port === '5432') {
    throw new Error('Refusing database port 5432');
  }
  if (database.port !== '55434' || database.pathname !== '/bidplace_integration') {
    throw new Error(
      'Refusing a database other than 127.0.0.1:55434/bidplace_integration',
    );
  }
}

export function bidLoadProblems(input) {
  const problems = [];
  let accepted = 0;
  for (const bid of input.bids) {
    if (bid.status === 200) {
      accepted += 1;
      continue;
    }
    if (bid.status === 409 && ALLOWED_REFUSAL.has(bid.code)) continue;
    problems.push(
      bid.status === 0
        ? 'network'
        : `http ${bid.status}${bid.code ? ` ${bid.code}` : ''}`,
    );
  }
  if (accepted === 0) problems.push('no accepted bid');
  if (input.tickStatus !== 200) problems.push(`tick ${input.tickStatus}`);
  if (accepted > 0 && input.orders !== 1) problems.push(`orders ${input.orders}`);
  const listing = input.listing;
  if (
    !listing ||
    listing.bid_count !== input.liveBids ||
    listing.current_price_minor !== input.maxStoredAmount ||
    accepted !== input.liveBids
  ) {
    problems.push('price bids counter');
  }
  return problems;
}
