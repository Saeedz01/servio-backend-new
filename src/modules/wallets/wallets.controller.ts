import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { WalletsService } from './wallets.service.js';

const spendSchema = z.object({
  amount: z.number().int().positive().default(5),
});

@Controller('provider-token-wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @Get('provider/:providerId')
  getForProvider(@Param('providerId') providerId: string) {
    return this.walletsService.getOrEnsureForProvider(providerId);
  }

  /** Deduct coins (contact reveal). Body: { amount?: number } default 5. */
  @Post('provider/:providerId/spend')
  spend(
    @Param('providerId') providerId: string,
    @Body({ schema: spendSchema }) body: z.infer<typeof spendSchema>,
  ) {
    return this.walletsService.spend(providerId, body.amount ?? 5);
  }

  /** Manual / scheduled monthly refill: set every provider wallet to 40 coins. */
  @Post('refill-monthly')
  refillMonthly() {
    return this.walletsService.refillAllMonthly();
  }
}
