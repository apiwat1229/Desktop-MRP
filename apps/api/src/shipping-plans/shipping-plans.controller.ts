import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateShippingPlanDto } from './dto/create-shipping-plan.dto';
import { ShippingPlansService } from './shipping-plans.service';

@Controller('shipping-plans')
export class ShippingPlansController {
    constructor(private readonly shippingPlansService: ShippingPlansService) { }

    @Post()
    create(@Body() createDto: CreateShippingPlanDto) {
        return this.shippingPlansService.create(createDto);
    }

    @Get()
    findAll() {
        return this.shippingPlansService.findAll();
    }

    @Get('available-pallets')
    findAvailablePallets() {
        return this.shippingPlansService.findAvailablePallets();
    }
}
