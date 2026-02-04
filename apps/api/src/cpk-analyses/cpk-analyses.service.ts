import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCpkAnalysisDto } from './dto/create-cpk-analysis.dto';

@Injectable()
export class CpkAnalysesService {
    constructor(private prisma: PrismaService) { }

    async create(createCpkAnalysisDto: CreateCpkAnalysisDto) {
        return this.prisma.cpkAnalysis.create({
            data: createCpkAnalysisDto,
        });
    }

    async findAll() {
        return this.prisma.cpkAnalysis.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.cpkAnalysis.findUnique({
            where: { id },
        });
    }

    async remove(id: string) {
        return this.prisma.cpkAnalysis.delete({
            where: { id },
        });
    }
}
