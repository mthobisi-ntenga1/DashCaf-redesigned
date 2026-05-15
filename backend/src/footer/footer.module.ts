import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalConfig } from './global-config.entity';
import { FeeConfig } from './fee-config.entity';
import { FooterService } from './footer.service';
import { FooterController } from './footer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalConfig, FeeConfig])],
  providers: [FooterService],
  controllers: [FooterController],
  exports: [FooterService],
})
export class FooterModule {}
