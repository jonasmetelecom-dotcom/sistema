"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMikrotikApiCredentials1707612000000 = void 0;
class AddMikrotikApiCredentials1707612000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "rbs" 
      ADD COLUMN "apiUsername" character varying,
      ADD COLUMN "apiPassword" character varying,
      ADD COLUMN "apiPort" integer DEFAULT 8728,
      ADD COLUMN "monitoringMethod" character varying DEFAULT 'api'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "rbs" 
      DROP COLUMN "apiUsername",
      DROP COLUMN "apiPassword",
      DROP COLUMN "apiPort",
      DROP COLUMN "monitoringMethod"
    `);
    }
}
exports.AddMikrotikApiCredentials1707612000000 = AddMikrotikApiCredentials1707612000000;
//# sourceMappingURL=1707612000000-AddMikrotikApiCredentials.js.map