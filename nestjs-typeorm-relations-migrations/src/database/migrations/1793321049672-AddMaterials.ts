import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterials1793321049672 implements MigrationInterface {
  name = 'AddMaterials1793321049672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(80) NOT NULL, CONSTRAINT "UQ_9b614bb357c5d8741a1a381385c" UNIQUE ("name"), CONSTRAINT "PK_2fd1a93ecb222a28bef28663fa0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "clothing_materials" ("clothing_id" uuid NOT NULL, "material_id" uuid NOT NULL, CONSTRAINT "PK_3c56a3342bcf00034fa7cb16a75" PRIMARY KEY ("clothing_id", "material_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cef3ff8b54e3be7d04ab3dfdba" ON "clothing_materials"  ("clothing_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01f941b1af05aae4560dc8e77a" ON "clothing_materials"  ("material_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "clothing_materials" ADD CONSTRAINT "FK_cef3ff8b54e3be7d04ab3dfdba2" FOREIGN KEY ("clothing_id") REFERENCES "clothes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "clothing_materials" ADD CONSTRAINT "FK_01f941b1af05aae4560dc8e77a1" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clothing_materials" DROP CONSTRAINT "FK_01f941b1af05aae4560dc8e77a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clothing_materials" DROP CONSTRAINT "FK_cef3ff8b54e3be7d04ab3dfdba2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_01f941b1af05aae4560dc8e77a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cef3ff8b54e3be7d04ab3dfdba"`,
    );
    await queryRunner.query(`DROP TABLE "clothing_materials"`);
    await queryRunner.query(`DROP TABLE "materials"`);
  }
}
