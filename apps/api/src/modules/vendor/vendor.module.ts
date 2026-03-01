import { Module } from '@nestjs/common';

import { VendorController } from './vendor.controller.js';
import { VendorService } from './vendor.service.js';

@Module({
  controllers: [VendorController],
  providers: [VendorService]
})
export class VendorModule {}
