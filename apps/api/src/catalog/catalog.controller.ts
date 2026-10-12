import { catalogTermRoleSchema } from '@bidplace/contracts';
import { Controller, Get, Query } from '@nestjs/common';

import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('countries')
  listCountries(@Query('q') query?: string) {
    return this.catalog.listCountries(query);
  }

  @Get('catalog/terms')
  listTerms(@Query('role') role?: string) {
    const parsed = role ? catalogTermRoleSchema.parse(role) : undefined;
    return this.catalog.listTerms(parsed);
  }
}
