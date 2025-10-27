import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1698000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Projects table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        api_key TEXT UNIQUE NOT NULL,
        active BOOLEAN DEFAULT true,
        retention_days INT DEFAULT 30,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        project_id UUID REFERENCES projects(id),
        active BOOLEAN DEFAULT true,
        oauth_provider TEXT,
        oauth_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        route VARCHAR(500),
        status INT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_route ON events(route)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN(payload)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_payload_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_route`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_project_id`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS events CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects CASCADE`);
  }
}

