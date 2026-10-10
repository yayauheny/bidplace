import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import {
  ApiErrorCode,
  emailAddressSchema,
  type EmailVerificationState,
  type User,
} from '@bidplace/contracts';

import { authKeys, currentAuthEpoch, readAuthEpoch, subscribeAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { createOperationKey } from './recovery-operation';

export type VerificationReason =
  | { kind: 'accepted' }
  | { kind: 'unknown' }
  | { kind: 'rejected' }
  | { kind: 'rate-limit' }
  | { kind: 'cooldown' }
  | { kind: 'quota' }
  | { kind: 'budget' }
  | { kind: 'paused' }
  | { kind: 'otp-invalid' }
  | { kind: 'otp-expired' }
  | { kind: 'challenge'; outcome: 'required' | 'failed' | 'unavailable' }
  | { kind: 'network' }
  | { kind: 'taken' }
  | { kind: 'disposable' }
  | { kind: 'validation' }
  | { kind: 'read-error' }
  | { kind: 'session' }
  | { kind: 'code-invalidated' }
  | { kind: 'unavailable' };

type ReadStatus = 'loading' | 'ready' | 'error';

type Deadlines = {
  resendAvailableAt: number | null;
  pausedUntil: number | null;
  codeExpiresAt: number | null;
  quotaResetsAt: number | null;
};

type Scope = {
  userId: string;
  email: string;
  authEpoch: number;
};

type Ticket = {
  key: string;
  ownerId: string;
  email: string;
  content: string;
  rotate: boolean;
  uncertain?: boolean;
};

const EMPTY_DEADLINES: Deadlines = {
  resendAvailableAt: null,
  pausedUntil: null,
  codeExpiresAt: null,
  quotaResetsAt: null,
};

function logicalEmail(email: string) {
  return email.trim().toLowerCase();
}

function remainingSeconds(deadline: number | null, now: number) {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function localInstant(instant: string | null, offsetMs: number) {
  if (!instant) return null;
  const parsed = Date.parse(instant);
  if (Number.isNaN(parsed)) return null;
  return parsed + offsetMs;
}

function detailInstant(details: unknown, key: 'retryAt' | 'pausedUntil') {
  if (typeof details !== 'object' || details === null) return null;
  if (!Object.prototype.hasOwnProperty.call(details, key)) return null;
  const value = Reflect.get(details, key);
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return null;
  return value;
}

function isAbort(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function reasonFor(error: unknown): VerificationReason {
  if (!(error instanceof ApiClientError)) return { kind: 'network' };
  switch (error.code) {
    case ApiErrorCode.MAIL_COOLDOWN:
      return { kind: 'cooldown' };
    case ApiErrorCode.MAIL_QUOTA:
      return { kind: 'quota' };
    case ApiErrorCode.MAIL_BUDGET:
      return { kind: 'budget' };
    case ApiErrorCode.MAIL_REJECTED:
      return { kind: 'rejected' };
    case ApiErrorCode.RATE_LIMITED:
      return { kind: 'rate-limit' };
    case ApiErrorCode.OTP_PAUSED:
      return { kind: 'paused' };
    case ApiErrorCode.OTP_INVALID:
      return { kind: 'otp-invalid' };
    case ApiErrorCode.OTP_EXPIRED:
      return { kind: 'otp-expired' };
    case ApiErrorCode.TURNSTILE_REQUIRED:
      return { kind: 'challenge', outcome: 'required' };
    case ApiErrorCode.TURNSTILE_FAILED:
      return { kind: 'challenge', outcome: 'failed' };
    case ApiErrorCode.TURNSTILE_UNAVAILABLE:
      return { kind: 'challenge', outcome: 'unavailable' };
    case ApiErrorCode.DISPOSABLE_EMAIL:
      return { kind: 'disposable' };
    case ApiErrorCode.VALIDATION_ERROR:
      return { kind: 'validation' };
    case ApiErrorCode.CONFLICT:
      return { kind: 'taken' };
    default:
      break;
  }
  if (error.kind === 'rate_limited') return { kind: 'rate-limit' };
  if (
    error.kind === 'network' ||
    error.kind === 'server' ||
    error.kind === 'unexpected_response'
  ) {
    return { kind: 'network' };
  }
  return { kind: 'rejected' };
}

function uncertainSendFailure(error: unknown) {
  if (!(error instanceof ApiClientError)) return true;
  return error.kind === 'network';
}

function keepsKey(error: unknown) {
  if (!(error instanceof ApiClientError)) return true;
  if (error.code === ApiErrorCode.OTP_INVALID || error.code === ApiErrorCode.OTP_EXPIRED) {
    return true;
  }
  if (
    error.code === ApiErrorCode.MAIL_COOLDOWN ||
    error.code === ApiErrorCode.MAIL_QUOTA ||
    error.code === ApiErrorCode.MAIL_BUDGET ||
    error.code === ApiErrorCode.MAIL_REJECTED ||
    error.code === ApiErrorCode.RATE_LIMITED ||
    error.code === ApiErrorCode.TURNSTILE_REQUIRED ||
    error.code === ApiErrorCode.TURNSTILE_FAILED ||
    error.code === ApiErrorCode.TURNSTILE_UNAVAILABLE ||
    error.code === ApiErrorCode.IDEMPOTENCY_CONFLICT ||
    error.code === ApiErrorCode.CONFLICT ||
    error.code === ApiErrorCode.DISPOSABLE_EMAIL ||
    error.code === ApiErrorCode.VALIDATION_ERROR
  ) {
    return false;
  }
  return (
    error.kind === 'network' ||
    error.kind === 'server' ||
    error.kind === 'unexpected_response'
  );
}

function replayAdmissionRefusal(error: unknown) {
  if (!(error instanceof ApiClientError)) return false;
  switch (error.code) {
    case ApiErrorCode.RATE_LIMITED:
    case ApiErrorCode.MAIL_COOLDOWN:
    case ApiErrorCode.MAIL_QUOTA:
    case ApiErrorCode.MAIL_BUDGET:
    case ApiErrorCode.TURNSTILE_REQUIRED:
    case ApiErrorCode.TURNSTILE_FAILED:
    case ApiErrorCode.TURNSTILE_UNAVAILABLE:
      return true;
    default:
      return error.code == null && error.kind === 'rate_limited';
  }
}

function nextTicket(
  current: Ticket | null,
  input: { ownerId: string; email: string; content: string },
): Ticket {
  if (
    current &&
    !current.rotate &&
    current.ownerId === input.ownerId &&
    current.email === input.email &&
    current.content === input.content
  ) {
    return current;
  }
  return {
    key: createOperationKey(),
    ownerId: input.ownerId,
    email: input.email,
    content: input.content,
    rotate: false,
  };
}

export function useEmailVerification(input: {
  focused: boolean;
  onVerified: () => void;
}) {
  const auth = useAuth();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const user = auth.user;
  const userId = user?.id ?? null;
  const email = user?.email ?? null;
  const [readStatus, setReadStatus] = useState<ReadStatus>('loading');
  const [serverState, setServerState] = useState<EmailVerificationState | null>(null);
  const [deadlines, setDeadlines] = useState<Deadlines>(EMPTY_DEADLINES);
  const [now, setNow] = useState(() => Date.now());
  const [reason, setReason] = useState<VerificationReason | null>(null);
  const [code, setCodeState] = useState('');
  const [rejectedCode, setRejectedCode] = useState<string | null>(null);
  const [editingEmail, setEditingEmailState] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [epoch, setEpoch] = useState(() => currentAuthEpoch(queryClient));
  const mounted = useRef(true);
  const generation = useRef(0);
  const offsetMs = useRef(0);
  const focusedRef = useRef(input.focused);
  const onVerifiedRef = useRef(input.onVerified);
  const apiRef = useRef(api);
  const userRef = useRef(user);
  const codeRef = useRef(code);
  const rejectedRef = useRef(rejectedCode);
  const deadlinesRef = useRef(deadlines);
  const editingRef = useRef(editingEmail);
  const sendTicket = useRef<Ticket | null>(null);
  const verifyTicket = useRef<Ticket | null>(null);
  const loadController = useRef<AbortController | null>(null);
  const actionController = useRef<AbortController | null>(null);
  const phaseRef = useRef<'send' | 'verify' | 'correct' | null>(null);
  const busy = useRef(false);
  const readStatusRef = useRef(readStatus);
  const serverEmailRef = useRef<string | null>(null);
  const installedEmail = useRef<{ ownerId: string; email: string; epoch: number } | null>(null);
  const seenEmail = useRef<string | null>(null);
  const retireActionRef = useRef<() => void>(() => {});
  focusedRef.current = input.focused;
  onVerifiedRef.current = input.onVerified;
  apiRef.current = api;
  userRef.current = user;
  codeRef.current = code;
  rejectedRef.current = rejectedCode;
  deadlinesRef.current = deadlines;
  editingRef.current = editingEmail;
  readStatusRef.current = readStatus;

  const ownerKey = `${userId ?? ''}|${email ? logicalEmail(email) : ''}|${epoch}|${input.focused ? '1' : '0'}`;
  const [trackedOwner, setTrackedOwner] = useState(ownerKey);
  if (trackedOwner !== ownerKey) {
    setTrackedOwner(ownerKey);
    const logical = email ? logicalEmail(email) : null;
    const installed = installedEmail.current;
    const preserving = Boolean(
      input.focused &&
      userId &&
      logical &&
      installed &&
      installed.ownerId === userId &&
      installed.email === logical &&
      installed.epoch === epoch,
    );
    if (!preserving) {
      codeRef.current = '';
      rejectedRef.current = null;
      editingRef.current = null;
      sendTicket.current = null;
      verifyTicket.current = null;
      serverEmailRef.current = null;
      offsetMs.current = 0;
      busy.current = false;
      phaseRef.current = null;
      setServerState(null);
      setDeadlines(EMPTY_DEADLINES);
      setReason(null);
      setCodeState('');
      setRejectedCode(null);
      setEditingEmailState(null);
      setReadStatus('loading');
      setReading(false);
      setSending(false);
      setVerifying(false);
      setCorrecting(false);
    }
  }

  const isCurrent = useCallback((token: number, scope: Scope, signal: AbortSignal) => {
    const current = userRef.current;
    return (
      mounted.current &&
      focusedRef.current &&
      token === generation.current &&
      !signal.aborted &&
      current?.id === scope.userId &&
      logicalEmail(current.email) === scope.email &&
      currentAuthEpoch(queryClient) === scope.authEpoch
    );
  }, [queryClient]);

  const applyState = useCallback((state: EmailVerificationState, localNow: number) => {
    const server = Date.parse(state.serverNow);
    if (Number.isNaN(server)) {
      setReadStatus('error');
      setReason({ kind: 'read-error' });
      return;
    }
    const offset = localNow - server;
    offsetMs.current = offset;
    setDeadlines({
      resendAvailableAt: localInstant(state.resendAvailableAt, offset),
      pausedUntil: localInstant(state.pausedUntil, offset),
      codeExpiresAt: localInstant(state.codeExpiresAt, offset),
      quotaResetsAt: localInstant(state.quotaResetsAt, offset),
    });
    serverEmailRef.current = logicalEmail(state.email);
    setServerState(state);
    setReadStatus('ready');
    setReading(false);
    setReason((current) => current?.kind === 'read-error' ? null : current);
  }, []);

  const installOwner = useCallback((next: User, token: number, scope: Scope, signal: AbortSignal) => {
    if (!isCurrent(token, scope, signal)) return false;
    if (!readAuthEpoch(queryClient).writesOpen) return false;
    const cached = queryClient.getQueryData<User | null>(authKeys.session) ?? null;
    if (cached?.id !== scope.userId || next.id !== scope.userId) return false;
    queryClient.setQueryData(authKeys.session, next);
    return true;
  }, [isCurrent, queryClient]);

  const stillOwner = useCallback((
    token: number,
    scope: Scope,
    signal: AbortSignal,
    allowedEmails: readonly string[],
  ) => {
    const current = userRef.current;
    const currentEmail = current?.email ? logicalEmail(current.email) : null;
    return (
      mounted.current &&
      focusedRef.current &&
      token === generation.current &&
      !signal.aborted &&
      current?.id === scope.userId &&
      currentEmail !== null &&
      allowedEmails.includes(currentEmail) &&
      currentAuthEpoch(queryClient) === scope.authEpoch
    );
  }, [queryClient]);

  const finishVerified = useCallback(async (token: number, scope: Scope, signal: AbortSignal) => {
    const session = await apiRef.current.auth.me({ signal });
    if (!isCurrent(token, scope, signal)) return;
    if (session.user.id !== scope.userId || !session.user.emailVerifiedAt) {
      setReason({ kind: 'session' });
      return;
    }
    if (!installOwner(session.user, token, scope, signal)) return;
    if (!isCurrent(token, scope, signal)) return;
    onVerifiedRef.current();
  }, [installOwner, isCurrent]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadController.current?.abort();
      actionController.current?.abort();
    };
  }, []);

  useEffect(() => subscribeAuthEpoch(queryClient, () => {
    setEpoch(currentAuthEpoch(queryClient));
  }), [queryClient]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const onVisibility = () => setNow(Date.now());
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, []);

  retireActionRef.current = () => {
    const controller = actionController.current;
    if (!controller) return;
    generation.current += 1;
    controller.abort();
    if (actionController.current !== controller) return;
    actionController.current = null;
    phaseRef.current = null;
    busy.current = false;
    setSending(false);
    setVerifying(false);
    setCorrecting(false);
  };

  useEffect(() => {
    if (!userId || !email || !input.focused) return;
    const logical = logicalEmail(email);
    const installed = installedEmail.current;
    if (
      installed &&
      installed.ownerId === userId &&
      installed.email === logical &&
      installed.epoch === epoch
    ) {
      installedEmail.current = null;
      seenEmail.current = logical;
      return;
    }
    if (seenEmail.current === null) {
      seenEmail.current = logical;
      return;
    }
    if (seenEmail.current === logical) return;
    seenEmail.current = logical;
    setReloadNonce((current) => current + 1);
  }, [email, epoch, input.focused, userId]);

  useEffect(() => {
    const active = userRef.current;
    const activeEmail = active?.id === userId ? active.email : null;
    if (!input.focused || !userId || !activeEmail) {
      generation.current += 1;
      const load = loadController.current;
      const action = actionController.current;
      loadController.current = null;
      actionController.current = null;
      phaseRef.current = null;
      busy.current = false;
      load?.abort();
      action?.abort();
      return;
    }
    const token = ++generation.current;
    const controller = new AbortController();
    loadController.current?.abort();
    loadController.current = controller;
    const previousAction = actionController.current;
    if (previousAction) {
      previousAction.abort();
      if (actionController.current === previousAction) {
        actionController.current = null;
        phaseRef.current = null;
        busy.current = false;
        setSending(false);
        setVerifying(false);
        setCorrecting(false);
      }
    }
    const scope: Scope = {
      userId,
      email: logicalEmail(activeEmail),
      authEpoch: currentAuthEpoch(queryClient),
    };
    setReading(true);
    setReadStatus('loading');
    void (async () => {
      try {
        const state = await apiRef.current.auth.emailVerificationState({ signal: controller.signal });
        if (!isCurrent(token, scope, controller.signal)) return;
        if (state.verified || logicalEmail(state.email) !== scope.email) {
          const session = await apiRef.current.auth.me({ signal: controller.signal });
          if (!isCurrent(token, scope, controller.signal)) return;
          if (session.user.id !== scope.userId) return;
          if (!installOwner(session.user, token, scope, controller.signal)) return;
          if (state.verified) {
            if (!session.user.emailVerifiedAt || !isCurrent(token, scope, controller.signal)) {
              setReadStatus('ready');
              setReading(false);
              setReason({ kind: 'session' });
              return;
            }
            onVerifiedRef.current();
            return;
          }
          if (logicalEmail(session.user.email) !== logicalEmail(state.email)) {
            setReadStatus('error');
            setReading(false);
            setReason({ kind: 'read-error' });
            return;
          }
        }
        if (!isCurrent(token, scope, controller.signal)) return;
        if (logicalEmail(state.email) !== scope.email) return;
        applyState(state, Date.now());
      } catch (error) {
        if (!isCurrent(token, scope, controller.signal) || isAbort(error)) return;
        setReadStatus('error');
        setReading(false);
        setReason({ kind: 'read-error' });
      }
    })();
    return () => {
      generation.current += 1;
      controller.abort();
    };
  }, [applyState, epoch, input.focused, installOwner, isCurrent, queryClient, reloadNonce, userId]);

  const openAction = useCallback((kind: 'send' | 'verify' | 'correct') => {
    const token = ++generation.current;
    const controller = new AbortController();
    loadController.current?.abort();
    actionController.current?.abort();
    actionController.current = controller;
    phaseRef.current = kind;
    busy.current = true;
    return { token, controller };
  }, []);

  const releaseAction = useCallback((controller: AbortController) => {
    if (actionController.current !== controller) return;
    actionController.current = null;
    phaseRef.current = null;
    busy.current = false;
    if (!mounted.current) return;
    setSending(false);
    setVerifying(false);
    setCorrecting(false);
  }, []);

  const readyScope = useCallback((): Scope | null => {
    const current = userRef.current;
    if (busy.current || !focusedRef.current || readStatusRef.current !== 'ready') return null;
    if (!current?.id || !current.email) return null;
    const logical = logicalEmail(current.email);
    if (serverEmailRef.current !== logical) return null;
    return {
      userId: current.id,
      email: logical,
      authEpoch: currentAuthEpoch(queryClient),
    };
  }, [queryClient]);

  const setCode = useCallback((value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    if (next === codeRef.current) return;
    codeRef.current = next;
    if (rejectedRef.current !== null && rejectedRef.current !== next) {
      rejectedRef.current = null;
    }
    if (phaseRef.current === 'verify') retireActionRef.current();
    setCodeState(next);
    setRejectedCode((current) => (current !== null && current !== next ? null : current));
  }, []);

  const setEditingEmail = useCallback((value: string | null) => {
    if (value === editingRef.current) return;
    editingRef.current = value;
    if (phaseRef.current === 'correct') retireActionRef.current();
    setEditingEmailState(value);
  }, []);

  const retry = useCallback(() => {
    if (!focusedRef.current) return;
    setReloadNonce((current) => current + 1);
  }, []);

  const send = useCallback(async (proof: string, explicitNewIntent = false) => {
    const scope = readyScope();
    if (!scope) return;
    if (!proof) {
      setReason({ kind: 'challenge', outcome: 'required' });
      return;
    }
    const retained = sendTicket.current;
    const replayRetained = Boolean(
      !explicitNewIntent &&
      retained &&
      retained.uncertain &&
      !retained.rotate &&
      retained.ownerId === scope.userId &&
      retained.email === scope.email &&
      retained.content === 'send',
    );
    const localNow = Date.now();
    const active = deadlinesRef.current;
    if (
      !replayRetained &&
      (
        (active.resendAvailableAt !== null && active.resendAvailableAt > localNow) ||
        (active.quotaResetsAt !== null && active.quotaResetsAt > localNow)
      )
    ) {
      return;
    }
    if (explicitNewIntent && retained) {
      sendTicket.current = { ...retained, rotate: true, uncertain: false };
    }
    let ticket: Ticket;
    try {
      ticket = nextTicket(sendTicket.current, {
        ownerId: scope.userId,
        email: scope.email,
        content: 'send',
      });
    } catch {
      setReason({ kind: 'unavailable' });
      return;
    }
    sendTicket.current = ticket;
    const { token, controller } = openAction('send');
    setSending(true);
    try {
      const result = await apiRef.current.auth.requestEmailVerification({
        idempotencyKey: ticket.key,
        turnstileToken: proof,
      }, { signal: controller.signal });
      if (!isCurrent(token, scope, controller.signal)) return;
      if (result.delivery === 'already_verified') {
        sendTicket.current = { ...ticket, rotate: true, uncertain: false };
        await finishVerified(token, scope, controller.signal);
        return;
      }
      if (result.delivery === 'unknown') {
        sendTicket.current = { ...ticket, rotate: false, uncertain: true };
        setReason({ kind: 'unknown' });
      } else {
        sendTicket.current = { ...ticket, rotate: true, uncertain: false };
        setReason({ kind: 'accepted' });
      }
      const state = await apiRef.current.auth.emailVerificationState({ signal: controller.signal });
      if (!isCurrent(token, scope, controller.signal)) return;
      if (logicalEmail(state.email) !== scope.email) return;
      applyState(state, Date.now());
    } catch (error) {
      if (!isCurrent(token, scope, controller.signal) || isAbort(error)) return;
      const keep = keepsKey(error);
      const retainUncertain = replayRetained && replayAdmissionRefusal(error);
      sendTicket.current = {
        ...ticket,
        rotate: retainUncertain ? false : !keep,
        uncertain: retainUncertain || (keep && uncertainSendFailure(error)),
      };
      setReason(reasonFor(error));
      const instant = error instanceof ApiClientError
        ? detailInstant(error.details, 'retryAt')
        : null;
      if (instant && error instanceof ApiClientError) {
        const local = localInstant(instant, offsetMs.current);
        if (error.code === ApiErrorCode.MAIL_COOLDOWN) {
          setDeadlines((prev) => ({ ...prev, resendAvailableAt: local }));
        }
        if (error.code === ApiErrorCode.MAIL_QUOTA) {
          setDeadlines((prev) => ({ ...prev, quotaResetsAt: local }));
        }
      }
    } finally {
      releaseAction(controller);
    }
  }, [applyState, finishVerified, isCurrent, openAction, readyScope, releaseAction]);

  const verify = useCallback(async () => {
    const entered = codeRef.current;
    const scope = readyScope();
    if (!scope) return;
    if (!/^\d{6}$/.test(entered)) {
      setReason({ kind: 'validation' });
      return;
    }
    if (rejectedRef.current === entered) return;
    const localNow = Date.now();
    const active = deadlinesRef.current;
    if (active.pausedUntil !== null && active.pausedUntil > localNow) {
      setReason({ kind: 'paused' });
      return;
    }
    if (active.codeExpiresAt !== null && active.codeExpiresAt <= localNow) {
      setReason({ kind: 'otp-expired' });
      return;
    }
    let ticket: Ticket;
    try {
      ticket = nextTicket(verifyTicket.current, {
        ownerId: scope.userId,
        email: scope.email,
        content: entered,
      });
    } catch {
      setReason({ kind: 'unavailable' });
      return;
    }
    verifyTicket.current = ticket;
    const { token, controller } = openAction('verify');
    setVerifying(true);
    try {
      await apiRef.current.auth.verifyEmailVerification({
        code: entered,
        idempotencyKey: ticket.key,
      }, { signal: controller.signal });
      if (!isCurrent(token, scope, controller.signal)) return;
      verifyTicket.current = { ...ticket, rotate: true };
      await finishVerified(token, scope, controller.signal);
    } catch (error) {
      if (!isCurrent(token, scope, controller.signal) || isAbort(error)) return;
      verifyTicket.current = { ...ticket, rotate: !keepsKey(error) };
      if (error instanceof ApiClientError && error.code === ApiErrorCode.OTP_INVALID) {
        rejectedRef.current = entered;
        setRejectedCode(entered);
      }
      const paused = error instanceof ApiClientError
        ? detailInstant(error.details, 'pausedUntil')
        : null;
      if (paused && error instanceof ApiClientError && error.code === ApiErrorCode.OTP_PAUSED) {
        setDeadlines((prev) => ({
          ...prev,
          pausedUntil: localInstant(paused, offsetMs.current),
        }));
      }
      setReason(reasonFor(error));
    } finally {
      releaseAction(controller);
    }
  }, [finishVerified, isCurrent, openAction, readyScope, releaseAction]);

  const correct = useCallback(async () => {
    const draft = editingRef.current;
    const scope = readyScope();
    if (!scope || draft === null) return;
    const parsed = emailAddressSchema.safeParse(draft);
    if (!parsed.success) {
      setReason({ kind: 'validation' });
      return;
    }
    const nextEmail = logicalEmail(parsed.data);
    if (nextEmail === scope.email) {
      editingRef.current = null;
      setEditingEmailState(null);
      return;
    }
    const allowedEmails = [scope.email, nextEmail];
    const { token, controller } = openAction('correct');
    setCorrecting(true);
    try {
      const response = await apiRef.current.auth.changeUnverifiedEmail({
        email: nextEmail,
      }, { signal: controller.signal });
      if (!stillOwner(token, scope, controller.signal, allowedEmails)) return;
      if (response.user.id !== scope.userId) {
        setReason({ kind: 'session' });
        return;
      }
      const cached = queryClient.getQueryData<User | null>(authKeys.session) ?? null;
      if (cached?.id !== scope.userId || !readAuthEpoch(queryClient).writesOpen) return;
      installedEmail.current = { ownerId: scope.userId, email: nextEmail, epoch: scope.authEpoch };
      queryClient.setQueryData(authKeys.session, response.user);
      sendTicket.current = sendTicket.current
        ? { ...sendTicket.current, rotate: true, uncertain: false }
        : null;
      verifyTicket.current = null;
      codeRef.current = '';
      rejectedRef.current = null;
      editingRef.current = null;
      setCodeState('');
      setRejectedCode(null);
      setEditingEmailState(null);
      setReason({ kind: 'code-invalidated' });
      serverEmailRef.current = null;
      setServerState(null);
      setDeadlines((current) => ({ ...current, codeExpiresAt: null }));
      setReadStatus('loading');
      setReading(true);
      try {
        const state = await apiRef.current.auth.emailVerificationState({ signal: controller.signal });
        if (!stillOwner(token, scope, controller.signal, allowedEmails)) return;
        const installed = queryClient.getQueryData<User | null>(authKeys.session) ?? null;
        if (installed?.id !== scope.userId || logicalEmail(installed.email) !== nextEmail) return;
        if (logicalEmail(state.email) !== nextEmail) return;
        applyState(state, Date.now());
      } catch (readError) {
        if (!stillOwner(token, scope, controller.signal, allowedEmails) || isAbort(readError)) return;
        setReading(false);
        setReadStatus('error');
        setReason({ kind: 'read-error' });
      }
    } catch (error) {
      if (!stillOwner(token, scope, controller.signal, [scope.email]) || isAbort(error)) return;
      if (error instanceof ApiClientError && error.code === ApiErrorCode.CONFLICT) {
        try {
          const state = await apiRef.current.auth.emailVerificationState({ signal: controller.signal });
          if (!stillOwner(token, scope, controller.signal, [scope.email])) return;
          if (state.verified && logicalEmail(state.email) === scope.email) {
            await finishVerified(token, scope, controller.signal);
            return;
          }
          setReason({ kind: 'taken' });
          return;
        } catch (refreshError) {
          if (!stillOwner(token, scope, controller.signal, [scope.email]) || isAbort(refreshError)) return;
          setReadStatus('error');
          setReason({ kind: 'read-error' });
          return;
        }
      }
      setReason(reasonFor(error));
    } finally {
      releaseAction(controller);
    }
  }, [applyState, finishVerified, openAction, queryClient, readyScope, releaseAction, stillOwner]);

  const retainedSend = sendTicket.current;
  const retrySendPending = Boolean(
    retainedSend?.uncertain &&
    !retainedSend.rotate &&
    userId &&
    email &&
    retainedSend.ownerId === userId &&
    retainedSend.email === logicalEmail(email) &&
    retainedSend.content === 'send',
  );
  const verifyLocked = rejectedCode !== null && rejectedCode === code;

  return {
    readStatus,
    serverState,
    reason,
    deadlines,
    now,
    remaining: {
      resend: remainingSeconds(deadlines.resendAvailableAt, now),
      pause: remainingSeconds(deadlines.pausedUntil, now),
      code: remainingSeconds(deadlines.codeExpiresAt, now),
      quota: remainingSeconds(deadlines.quotaResetsAt, now),
    },
    code,
    setCode,
    verifyLocked,
    editingEmail,
    setEditingEmail,
    reading,
    sending,
    verifying,
    correcting,
    retrySendPending,
    retry,
    send,
    verify,
    correct,
  };
}
