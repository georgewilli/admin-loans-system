import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
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
