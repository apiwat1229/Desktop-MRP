import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShippingPlansController } from './shipping-plans.controller';
import { ShippingPlansService } from './shipping-plans.service';

@Module({
    imports: [PrismaModule],
    controllers: [ShippingPlansController],
    providers: [ShippingPlansService],
    exports: [ShippingPlansService],
})
export class ShippingPlansModule { }
