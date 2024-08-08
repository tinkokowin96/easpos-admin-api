import { AppController } from '@common/decorator/app_controller.decorator';
import { CreateMerchantDto } from '@common/dto/merchant.dto';
import { Body, Get, Post, Req } from '@nestjs/common';
import { MerchantService } from './merchant.service';

@AppController('merchant')
export class MerchantController {
   constructor(private readonly service: MerchantService) {}

   @Post('create')
   async createMerchant(@Body() dto: CreateMerchantDto) {
      return this.service.createMerchant(dto);
   }

   @Get('test')
   test() {
      return this.service.tmpTst();
   }
}
