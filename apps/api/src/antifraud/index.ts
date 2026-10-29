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
