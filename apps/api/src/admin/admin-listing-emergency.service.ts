import { type AdminEmergencyCancelRequest } from '@bidplace/contracts';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { canAdminEmergencyCancelListing } from '../core/auction';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class AdminListingEmergencyService {
  private readonly logger = new Logger(AdminListingEmergencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async emergencyCancel(
    adminUserId: string,
    listingId: string,
    input: AdminEmergencyCancelRequest,
  ): Promise<{ ok: true }> {
    const result = await runSerializableTransaction(this.prisma, async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          status: true,
          currentPrice: true,
          bidCount: true,
          endsAt: true,
        },
      });

      if (!listing) {
        this.logger.warn('Emergency cancel target listing was not found');
        throw new NotFoundException('Listing not found');
      }

      if (listing.status === 'CANCELLED') {
        return { kind: 'already_cancelled' as const, listing };
      }

      if (!canAdminEmergencyCancelListing(listing.status)) {
        this.logger.warn(
          `Blocked emergency cancel target=${listing.id} status=${listing.status}`,
        );
        throw new ConflictException(
          'Listing cannot be emergency-cancelled in its current status',
        );
      }

      const updated = await tx.listing.update({
        where: { id: listingId },
        data: { status: 'CANCELLED' },
        select: {
          id: true,
          status: true,
          currentPrice: true,
          bidCount: true,
          endsAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: adminUserId,
          targetType: 'LISTING',
          targetId: listing.id,
          oldStatus: listing.status,
          newStatus: 'CANCELLED',
          reason: input.reason,
        },
      });

      return { kind: 'cancelled' as const, listing: updated };
    });

    if (result.kind === 'cancelled') {
      this.realtime.emit(result.listing.id, 'listing.updated', {
        listingId: result.listing.id,
        currentPrice: result.listing.currentPrice.toNumber(),
        bidCount: result.listing.bidCount,
        status: result.listing.status,
        endsAt: result.listing.endsAt.toISOString(),
      });
    }

    return { ok: true as const };
  }
}
