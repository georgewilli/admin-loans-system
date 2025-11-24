import { Controller, Get, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // Get all accounts - must come before :id route
  @Get()
  async getAllAccounts() {
    return this.accountsService.getAllAccounts();
  }

  // Specific routes before parameterized routes
  @Get('by-user/:userId')
  async getAccountByUserId(@Param('userId') userId: string) {
    return this.accountsService.getAccountByUserId(userId);
  }

  // Parameterized routes come last
  @Get(':id')
  async getAccount(@Param('id') id: string) {
    return this.accountsService.getAccountWithDetails(id);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string) {
    const balance = await this.accountsService.getAccountBalance(id);
    return { accountId: id, balance };
  }
}
