import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingPlanDto } from './dto/create-shipping-plan.dto';

@Injectable()
export class ShippingPlansService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateShippingPlanDto) {
        const { items, ...planData } = createDto;

        try {
            return await this.prisma.shippingPlan.create({
                data: {
                    ...planData,
                    planDate: new Date(planData.planDate),
                    items: {
                        create: items,
                    },
                },
                include: {
                    items: {
                        include: {
                            row: true,
                        },
                    },
                },
            });
        } catch (error: any) {
            console.error('[ShippingPlansService] Error creating plan:', error);
            throw new InternalServerErrorException(
                `Failed to create shipping plan: ${error.message || 'Unknown error'}`,
            );
        }
    }

    async findAll() {
        return this.prisma.shippingPlan.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        row: true,
                    },
                },
            },
        });
    }

    async findAvailablePallets() {
        // Fetch all ProductionReportRow where at least one pallet is PASS
        // and that specific pallet is NOT yet in any ShippingPlanItem

        // This is a bit complex in Prisma without a dedicated Pallet model.
        // We'll fetch all rows with status PASS and filter in JS if needed,
        // or use a raw query if performance is an issue.
        // For now, let's fetch rows that have any PASS status.

        const rows = await this.prisma.productionReportRow.findMany({
            where: {
                OR: [
                    { weight1Status: 'PASS' },
                    { weight2Status: 'PASS' },
                    { weight3Status: 'PASS' },
                    { weight4Status: 'PASS' },
                    { weight5Status: 'PASS' },
                ],
            },
            include: {
                shippingItems: true,
            },
        });

        // Extract individual pallets that are PASS and not shipped
        const available = [];
        for (const row of rows) {
            for (let i = 1; i <= 5; i++) {
                const weight = (row as any)[`weight${i}`];
                const status = (row as any)[`weight${i}Status`];
                const isShipped = row.shippingItems.some((item) => item.palletNo === i);

                if (status === 'PASS' && weight > 0 && !isShipped) {
                    available.push({
                        rowId: row.id,
                        lotNo: row.lotNo,
                        palletNo: i,
                        weight: weight,
                        startTime: row.startTime,
                        palletType: row.palletType,
                    });
                }
            }
        }

        return available;
    }
}
