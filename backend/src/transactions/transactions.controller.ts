import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionStatus } from './entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction (purchase ticket)' })
  create(@Body() createTransactionDto: any, @Request() req: any) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Get('my-transactions')
  @ApiOperation({ summary: 'Get current user transactions' })
  findMyTransactions(@Request() req: any) {
    return this.transactionsService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update transaction status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: TransactionStatus }) {
    return this.transactionsService.updateStatus(id, body.status);
  }
}
