import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ShippingPlanItemDto {
    @IsString()
    rowId: string;

    @IsNumber()
    palletNo: number;
}

export class CreateShippingPlanDto {
    @IsString()
    planNo: string;

    @IsOptional()
    @IsString()
    customer?: string;

    @IsDateString()
    planDate: string | Date;

    @IsOptional()
    @IsString()
    remark?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShippingPlanItemDto)
    items: ShippingPlanItemDto[];
}
