import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMikrotikApiCredentials1707612000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add API credentials columns to rbs table
        await queryRunner.query(`
      ALTER TABLE "rbs" 
      ADD COLUMN "apiUsername" character varying,
      ADD COLUMN "apiPassword" character varying,
      ADD COLUMN "apiPort" integer DEFAULT 8728,
      ADD COLUMN "monitoringMethod" character varying DEFAULT 'api'
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove API credentials columns
        await queryRunner.query(`
      ALTER TABLE "rbs" 
      DROP COLUMN "apiUsername",
      DROP COLUMN "apiPassword",
      DROP COLUMN "apiPort",
      DROP COLUMN "monitoringMethod"
    `);
    }
}
