import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StoreDbService implements OnModuleDestroy {
  private connections = new Map<string, DataSource>();

  async getConnection(provisioning: {
    dbHost: string;
    dbPort: number;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    slug: string;
  }): Promise<DataSource> {
    const key = provisioning.slug;

    const existing = this.connections.get(key);
    if (existing?.isInitialized) return existing;

    const ds = new DataSource({
      type: 'postgres',
      host: provisioning.dbHost,
      port: provisioning.dbPort,
      database: provisioning.dbName,
      username: provisioning.dbUser,
      password: provisioning.dbPassword,
      synchronize: true,
      entities: [__dirname + '/../**/*.store-entity{.ts,.js}'],
    });

    await ds.initialize();
    this.connections.set(key, ds);
    return ds;
  }

  async closeConnection(slug: string) {
    const ds = this.connections.get(slug);
    if (ds?.isInitialized) {
      await ds.destroy();
      this.connections.delete(slug);
    }
  }

  async onModuleDestroy() {
    for (const [, ds] of this.connections) {
      if (ds.isInitialized) await ds.destroy();
    }
  }
}
