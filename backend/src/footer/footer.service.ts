import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalConfig } from './global-config.entity';
import { FeeConfig } from './fee-config.entity';

@Injectable()
export class FooterService {
  constructor(
    @InjectRepository(GlobalConfig)
    private readonly configRepo: Repository<GlobalConfig>,
    @InjectRepository(FeeConfig)
    private readonly feeRepo: Repository<FeeConfig>,
  ) {}

  async getConfig(): Promise<GlobalConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepo.create({ id: 1 });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(
    updates: Partial<GlobalConfig>,
    updatedBy: string,
  ): Promise<GlobalConfig> {
    const config = await this.getConfig();
    Object.assign(config, updates, { updatedBy });
    return this.configRepo.save(config);
  }

  async getFeeConfig(): Promise<FeeConfig> {
    let config = await this.feeRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.feeRepo.create({ id: 1 });
      await this.feeRepo.save(config);
    }
    return config;
  }
}
