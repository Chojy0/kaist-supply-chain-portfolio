import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1764553952613 implements MigrationInterface {
  name = 'Migration1764553952613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM ('tier1_supplier', 'tier2plus_supplier')`);
    await queryRunner.query(`CREATE TYPE "public"."feedbacks_type_enum" AS ENUM ('comment', 'approval', 'rejection')`);
    await queryRunner.query(`CREATE TYPE "public"."lca_data_verification_status_enum" AS ENUM ('pending', 'verified', 'failed')`);
    await queryRunner.query(`CREATE TYPE "public"."lca_data_status_enum" AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "public"."upload_requests_status_enum" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "public"."upload_requests_priority_enum" AS ENUM ('high', 'medium', 'low')`);
    await queryRunner.query(`CREATE TYPE "public"."upload_requests_lca_methodology_enum" AS ENUM ('iso_14040', 'ghg_protocol', 'pas_2050', 'custom')`);
    await queryRunner.query(`CREATE TYPE "public"."upload_requests_system_boundary_enum" AS ENUM ('cradle_to_gate', 'cradle_to_grave', 'gate_to_gate', 'gate_to_grave')`);

    await queryRunner.query(`
            CREATE TABLE "users" ( 
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "role" "public"."users_role_enum" NOT NULL,
                "parent_supplier_id" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "feedbacks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lca_data_id" uuid NOT NULL,
                "tier1_supplier_id" uuid NOT NULL,
                "content" text NOT NULL,
                "type" "public"."feedbacks_type_enum" NOT NULL DEFAULT 'comment',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "lca_data" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "supplier_id" uuid NOT NULL,
                "tier1_supplier_id" uuid NOT NULL,
                "upload_request_id" uuid,
                "productName" character varying NOT NULL,
                "file_path" character varying,
                "file_name" character varying,
                "file_size" integer,
                "file_hash" character varying,
                "inventory_data" json,
                "impact_assessment" json,
                "functional_unit" text,
                "reference_year" text,
                "data_quality" text,
                "verification_status" "public"."lca_data_verification_status_enum" NOT NULL DEFAULT 'pending',
                "status" "public"."lca_data_status_enum" NOT NULL DEFAULT 'draft',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7b251de0dd208e335af67495478" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "upload_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tier1_supplier_id" uuid NOT NULL,
                "tier2plus_supplier_id" uuid NOT NULL,
                "productName" character varying NOT NULL,
                "description" text,
                "deadline" date NOT NULL,
                "status" "public"."upload_requests_status_enum" NOT NULL DEFAULT 'pending',
                "priority" "public"."upload_requests_priority_enum" NOT NULL DEFAULT 'medium',
                "lca_methodology" "public"."upload_requests_lca_methodology_enum" NOT NULL DEFAULT 'iso_14040',
                "system_boundary" "public"."upload_requests_system_boundary_enum" NOT NULL DEFAULT 'cradle_to_gate',
                "functional_unit" text,
                "required_stages" json,
                "impact_categories" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d75377f46df32b7d3fa99f4ce7d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_dafe998bf3dc28cbcd7ef500429" FOREIGN KEY ("parent_supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "feedbacks"
            ADD CONSTRAINT "FK_901e1f0e1892a9c82fb07f8b7f4" FOREIGN KEY ("lca_data_id") REFERENCES "lca_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "feedbacks"
            ADD CONSTRAINT "FK_693ad09d2226e12515e1df388c4" FOREIGN KEY ("tier1_supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data"
            ADD CONSTRAINT "FK_eefa123daf390eb899490e3f75c" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data"
            ADD CONSTRAINT "FK_6ee8ec530ad718f960f5e943afc" FOREIGN KEY ("tier1_supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data"
            ADD CONSTRAINT "FK_326aa929e5027191752de86dfc8" FOREIGN KEY ("upload_request_id") REFERENCES "upload_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "upload_requests"
            ADD CONSTRAINT "FK_61b29031f90d5b5ef0722a06939" FOREIGN KEY ("tier1_supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "upload_requests"
            ADD CONSTRAINT "FK_5f5600494d9fd016e9cf64f5a48" FOREIGN KEY ("tier2plus_supplier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "upload_requests" DROP CONSTRAINT "FK_5f5600494d9fd016e9cf64f5a48"
        `);
    await queryRunner.query(`
            ALTER TABLE "upload_requests" DROP CONSTRAINT "FK_61b29031f90d5b5ef0722a06939"
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data" DROP CONSTRAINT "FK_326aa929e5027191752de86dfc8"
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data" DROP CONSTRAINT "FK_6ee8ec530ad718f960f5e943afc"
        `);
    await queryRunner.query(`
            ALTER TABLE "lca_data" DROP CONSTRAINT "FK_eefa123daf390eb899490e3f75c"
        `);
    await queryRunner.query(`
            ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_693ad09d2226e12515e1df388c4"
        `);
    await queryRunner.query(`
            ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_901e1f0e1892a9c82fb07f8b7f4"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_dafe998bf3dc28cbcd7ef500429"
        `);
    await queryRunner.query(`
            DROP TABLE "upload_requests"
        `);
    await queryRunner.query(`
            DROP TABLE "lca_data"
        `);
    await queryRunner.query(`
            DROP TABLE "feedbacks"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`DROP TYPE "public"."upload_requests_system_boundary_enum"`);
    await queryRunner.query(`DROP TYPE "public"."upload_requests_lca_methodology_enum"`);
    await queryRunner.query(`DROP TYPE "public"."upload_requests_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."upload_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lca_data_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lca_data_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."feedbacks_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
