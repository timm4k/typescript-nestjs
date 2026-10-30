import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareInstructions1793321100412 implements MigrationInterface {
  name = 'AddCareInstructions1793321100412';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "care_instructions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "washingTemperature" integer NOT NULL, "dryCleanOnly" boolean NOT NULL DEFAULT false, "instructions" character varying(500) NOT NULL, "clothing_id" uuid NOT NULL, CONSTRAINT "REL_f86c55468c9c5bed9a4e06b352" UNIQUE ("clothing_id"), CONSTRAINT "PK_b40d04705ccced5ae0b4c783c10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_instructions" ADD CONSTRAINT "FK_f86c55468c9c5bed9a4e06b3525" FOREIGN KEY ("clothing_id") REFERENCES "clothes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_instructions" DROP CONSTRAINT "FK_f86c55468c9c5bed9a4e06b3525"`,
    );
    await queryRunner.query(`DROP TABLE "care_instructions"`);
  }
}
