import { Injectable } from '@nestjs/common';
import { publicHomeResponseSchema } from '@bidplace/contracts';

import { ProductsService } from '../products/products.service';
import { SellersService } from '../sellers/sellers.service';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly products: ProductsService,
    private readonly sellers: SellersService,
  ) {}

  async home() {
    const [topAuctions, creators, newWorks] = await Promise.all([
      this.products.listPublic({ page: 1, limit: 3, sort: 'activity' }),
      this.sellers.listPublic({ page: 1, limit: 4, sort: 'activity' }),
      this.products.listPublic({ page: 1, limit: 3, sort: 'newest' }),
    ]);

    return publicHomeResponseSchema.parse({
      topAuctions: topAuctions.products,
      creators: creators.sellers,
      newWorks: newWorks.products,
    });
  }
}
