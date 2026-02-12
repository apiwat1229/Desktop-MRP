import { Module } from '@nestjs/common';
import { PlcController } from './plc.controller';
import { PlcGateway } from './plc.gateway';
import { PlcService } from './plc.service';

@Module({
    providers: [PlcService, PlcGateway],
    controllers: [PlcController],
    exports: [PlcService, PlcGateway],
})
export class PlcModule { }
