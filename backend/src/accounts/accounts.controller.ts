import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  // Get all accounts - must come before :id route
  @Get()
  @ApiOperation({ summary: 'Get all accounts', description: 'Retrieve all user and platform accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getAllAccounts() {
    return this.accountsService.getAllAccounts();
  }

  // Specific routes before parameterized routes
  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get account by user ID', description: 'Retrieve account associated with a specific user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountByUserId(@Param('userId') userId: string) {
    return this.accountsService.getAccountByUserId(userId);
  }

  // Parameterized routes come last
  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID', description: 'Retrieve detailed account information including loans' })
  @ApiParam({ name: 'id', type: String, description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('id') id: string) {
    return this.accountsService.getAccountWithDetails(id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance', description: 'Retrieve current balance for an account' })
  @ApiParam({ name: 'id', type: String, description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getBalance(@Param('id') id: string) {
    const balance = await this.accountsService.getAccountBalance(id);
    return { accountId: id, balance };
  }
}
