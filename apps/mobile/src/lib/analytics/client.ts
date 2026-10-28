import type {
  AnalyticsAttribution,
  AnalyticsEventName,
  AnalyticsIngestRequest,
  AnalyticsPlatform,
} from '@bidplace/contracts';

import { getOrCreateAnonymousId } from './anonymous-id';
import {
  captureFirstTouch,
  getFirstTouch,
  parseAttributionFromUrl,
  type StoredFirstTouch,
} from './attribution';
import {
  identifyUser,
  resetUser,
  type AnalyticsIdentityState,
} from './identity';

type AnalyticsEventInput = AnalyticsIngestRequest['events'][number];

type EventByName<Name extends AnalyticsEventName> = Extract<
  AnalyticsEventInput,
  { name: Name }
>;

type TrackPropertiesByName = {
  [Name in AnalyticsEventName]: EventByName<Name>['properties'];
};

export type AnalyticsIngestFn = (
  payload: AnalyticsIngestRequest,
) => Promise<unknown>;

export type CreateAnalyticsOptions = {
  ingest: AnalyticsIngestFn;
  getEnvironment: () => string;
  getPlatform: () => AnalyticsPlatform;
  getAppVersion?: () => string | undefined;
  isEnabled: () => boolean;
};

function toSendableAttribution(
  firstTouch: StoredFirstTouch | null,
): AnalyticsAttribution | undefined {
  if (!firstTouch) {
    return undefined;
  }

  const { capturedAt: _capturedAt, ...attribution } = firstTouch;
  void _capturedAt;

  if (Object.keys(attribution).length === 0) {
    return undefined;
  }

  return attribution;
}

function dedupeEntityId(
  name: AnalyticsEventName,
  properties: TrackPropertiesByName[AnalyticsEventName],
): string | null {
  if (name === 'listing_viewed') {
    return (properties as TrackPropertiesByName['listing_viewed'])
      .productPublicId;
  }
  if (name === 'seller_viewed') {
    return (properties as TrackPropertiesByName['seller_viewed'])
      .sellerProfileId;
  }
  return null;
}

export class AnalyticsClient {
  private readonly ingestFn: AnalyticsIngestFn;
  private readonly getEnvironment: () => string;
  private readonly getPlatform: () => AnalyticsPlatform;
  private readonly getAppVersion?: () => string | undefined;
  private readonly isEnabled: () => boolean;

  private identity: AnalyticsIdentityState | null = null;
  private firstTouch: StoredFirstTouch | null = null;
  private queue: AnalyticsEventInput[] = [];
  private readonly sessionDedupe = new Map<string, true>();
  private pendingClaimAcquisition = false;
  private pendingAttributionSync = false;
  private pendingIdentify: {
    userId: string;
    claimAcquisition?: boolean;
  } | null = null;
  private flushPromise: Promise<void> | null = null;
  private initialized = false;

  constructor(options: CreateAnalyticsOptions) {
    this.ingestFn = options.ingest;
    this.getEnvironment = options.getEnvironment;
    this.getPlatform = options.getPlatform;
    this.getAppVersion = options.getAppVersion;
    this.isEnabled = options.isEnabled;
  }

  async init(): Promise<void> {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

    const anonymousId = await getOrCreateAnonymousId();
    this.identity = { anonymousId, userId: null };
    this.firstTouch = await getFirstTouch();
    this.initialized = true;

    if (this.pendingIdentify) {
      const pending = this.pendingIdentify;
      this.pendingIdentify = null;
      this.applyIdentify(pending.userId, {
        claimAcquisition: pending.claimAcquisition,
      });
    }
  }

  async captureAttributionFromLaunch(url?: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.initialized) {
      await this.init();
    }

    if (!url) {
      return;
    }

    const partial = parseAttributionFromUrl(url);
    const saved = await captureFirstTouch(partial);
    if (saved) {
      this.firstTouch = saved;
      this.pendingAttributionSync = true;
      void this.scheduleFlush();
    }
  }

  identify(
    userId: string,
    options?: { claimAcquisition?: boolean },
  ): void {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.identity) {
      this.pendingIdentify = {
        userId,
        ...(options?.claimAcquisition
          ? { claimAcquisition: true }
          : {}),
      };
      void this.init();
      return;
    }

    this.applyIdentify(userId, options);
  }

  private applyIdentify(
    userId: string,
    options?: { claimAcquisition?: boolean },
  ): void {
    if (!this.identity) {
      return;
    }

    this.identity = identifyUser(this.identity, userId);
    if (options?.claimAcquisition) {
      this.pendingClaimAcquisition = true;
      void this.scheduleFlush();
    }
  }

  reset(): void {
    this.pendingIdentify = null;
    if (!this.identity) {
      return;
    }

    this.identity = resetUser(this.identity);
  }

  track<Name extends AnalyticsEventName>(
    name: Name,
    properties: TrackPropertiesByName[Name],
  ): void {
    try {
      if (!this.isEnabled()) {
        return;
      }

      const entityId = dedupeEntityId(name, properties);
      if (entityId) {
        const key = `${name}:${entityId}`;
        if (this.sessionDedupe.has(key)) {
          return;
        }
        this.sessionDedupe.set(key, true);
      }

      const event = {
        name,
        properties,
        clientCapturedAt: new Date().toISOString(),
      } as AnalyticsEventInput;

      this.queue.push(event);
      void this.scheduleFlush();
    } catch {
      // Analytics must never break product flows.
    }
  }

  async flush(): Promise<void> {
    await this.scheduleFlush();
  }

  private scheduleFlush(): Promise<void> {
    if (!this.isEnabled()) {
      return Promise.resolve();
    }

    if (!this.flushPromise) {
      this.flushPromise = Promise.resolve()
        .then(() => this.flushInternal())
        .finally(() => {
          this.flushPromise = null;
        });
    }

    return this.flushPromise;
  }

  private async flushInternal(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.identity) {
      return;
    }

    const attribution = toSendableAttribution(this.firstTouch);
    if (
      this.queue.length === 0 &&
      !this.pendingClaimAcquisition &&
      !this.pendingAttributionSync
    ) {
      return;
    }

    do {
      const batch = this.queue.splice(0, 25);
      const claimAcquisition = this.pendingClaimAcquisition;
      const syncAttribution = this.pendingAttributionSync;
      const appVersion = this.getAppVersion?.();
      const sendableAttribution = syncAttribution ? attribution : undefined;

      if (
        batch.length === 0 &&
        !claimAcquisition &&
        !syncAttribution
      ) {
        break;
      }

      const payload: AnalyticsIngestRequest = {
        anonymousId: this.identity.anonymousId,
        environment: this.getEnvironment(),
        platform: this.getPlatform(),
        events: batch,
        ...(appVersion ? { appVersion } : {}),
        ...(claimAcquisition ? { claimAcquisition: true } : {}),
        ...(sendableAttribution ? { attribution: sendableAttribution } : {}),
      };

      try {
        await this.ingestFn(payload);
        if (claimAcquisition) {
          this.pendingClaimAcquisition = false;
        }
        if (syncAttribution) {
          this.pendingAttributionSync = false;
        }
      } catch {
        this.queue = [...batch, ...this.queue];
        return;
      }
    } while (this.queue.length > 0);
  }
}

export function createAnalytics(
  options: CreateAnalyticsOptions,
): AnalyticsClient {
  return new AnalyticsClient(options);
}
