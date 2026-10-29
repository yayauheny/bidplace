export { AntifraudModule } from './antifraud.module';
export { AntifraudService } from './antifraud.service';
export type { MailDelivery } from './auth/auth-abuse.service';
export { readClientIpContext, resolveClientIp, type ClientIpRequest } from './auth/client-ip';
export {
  MAIL_BUDGET_PURPOSES,
  MAIL_SPEND_STATUSES,
  MAIL_MONTH_WINDOW_MS,
  PERSONAL_MAIL_WINDOW_MS,
} from './auth/auth-abuse.policy';
export { RateLimit, RATE_LIMIT_METADATA_KEY, type RateLimitOptions, type RateLimitScope } from './rate-limit/rate-limit.decorator';
export { RateLimitGuard } from './rate-limit/rate-limit.guard';
export { RateLimitModule } from './rate-limit/rate-limit.module';
