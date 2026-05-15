import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeSlug: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => MenuItem, (item) => item.category, { cascade: true, eager: true })
  items: MenuItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
