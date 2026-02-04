import { Module } from '@nestjs/common';
import { CpkAnalysesController } from './cpk-analyses.controller';
import { CpkAnalysesService } from './cpk-analyses.service';

@Module({
    controllers: [CpkAnalysesController],
    providers: [CpkAnalysesService],
})
export class CpkAnalysesModule { }
