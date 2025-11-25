import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Get audit logs',
        description: 'Retrieve system audit trail with filtering and pagination (Admin only)'
    })
    @ApiQuery({ name: 'filter', required: false, type: String, description: 'JSON filter object' })
    @ApiQuery({ name: 'range', required: false, type: String, description: 'JSON range array [start, end]' })
    @ApiQuery({ name: 'sort', required: false, type: String, description: 'JSON sort array [field, order]' })
    @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async findAll(
        @Query('filter') filter: string,
        @Query('range') range: string,
        @Query('sort') sort: string,
        @Res() res: Response,
    ) {
        const parsedFilter = filter ? JSON.parse(filter) : {};
        const parsedRange = range ? JSON.parse(range) : [0, 9];
        const parsedSort = sort ? JSON.parse(sort) : ['createdAt', 'DESC'];

        const { data, count } = await this.auditService.findAll({
            skip: parsedRange[0],
            take: parsedRange[1] - parsedRange[0] + 1,
            where: parsedFilter,
            orderBy: {
                [parsedSort[0]]: parsedSort[1].toLowerCase(),
            },
        });

        res.set('Content-Range', `audit-logs ${parsedRange[0]}-${parsedRange[1]}/${count}`);
        res.json(data);
    }
}
