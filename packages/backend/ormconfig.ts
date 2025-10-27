import { DataSource } from 'typeorm';
import { Event } from './src/modules/events/entities/event.entity';
import { User } from './src/modules/auth/entities/user.entity';
import { Project } from './src/modules/projects/entities/project.entity';
import { InitialSchema1698000000000 } from './src/migrations/1698000000000-InitialSchema';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://devtools:devtools@localhost:5432/nest_devtools',
  entities: [Event, User, Project],
  migrations: [InitialSchema1698000000000],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
});
