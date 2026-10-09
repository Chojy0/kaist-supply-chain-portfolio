import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 성능 최적화를 위한 인덱스 추가 마이그레이션
 */
export class AddIndexes1764553952614 implements MigrationInterface {
  name = 'AddIndexes1764553952614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // upload_requests 테이블 인덱스
    await queryRunner.query(`
      CREATE INDEX "idx_upload_requests_tier1_supplier"
      ON "upload_requests" ("tier1_supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_upload_requests_tier2plus_supplier"
      ON "upload_requests" ("tier2plus_supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_upload_requests_status"
      ON "upload_requests" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_upload_requests_deadline"
      ON "upload_requests" ("deadline")
    `);

    // lca_data 테이블 인덱스
    await queryRunner.query(`
      CREATE INDEX "idx_lca_data_supplier"
      ON "lca_data" ("supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_lca_data_tier1_supplier"
      ON "lca_data" ("tier1_supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_lca_data_upload_request"
      ON "lca_data" ("upload_request_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_lca_data_status"
      ON "lca_data" ("status")
    `);

    // feedbacks 테이블 인덱스
    await queryRunner.query(`
      CREATE INDEX "idx_feedbacks_lca_data"
      ON "feedbacks" ("lca_data_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_feedbacks_tier1_supplier"
      ON "feedbacks" ("tier1_supplier_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_upload_requests_tier1_supplier"`);
    await queryRunner.query(
      `DROP INDEX "idx_upload_requests_tier2plus_supplier"`,
    );
    await queryRunner.query(`DROP INDEX "idx_upload_requests_status"`);
    await queryRunner.query(`DROP INDEX "idx_upload_requests_deadline"`);
    await queryRunner.query(`DROP INDEX "idx_lca_data_supplier"`);
    await queryRunner.query(`DROP INDEX "idx_lca_data_tier1_supplier"`);
    await queryRunner.query(`DROP INDEX "idx_lca_data_upload_request"`);
    await queryRunner.query(`DROP INDEX "idx_lca_data_status"`);
    await queryRunner.query(`DROP INDEX "idx_feedbacks_lca_data"`);
    await queryRunner.query(`DROP INDEX "idx_feedbacks_tier1_supplier"`);
  }
}
