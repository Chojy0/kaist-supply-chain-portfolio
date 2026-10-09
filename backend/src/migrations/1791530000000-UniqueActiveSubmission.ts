import { MigrationInterface, QueryRunner } from 'typeorm';
export class UniqueActiveSubmission1791530000000 implements MigrationInterface {
  async up(q: QueryRunner) { await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "one_active_submission_per_request" ON "lca_data" ("upload_request_id") WHERE status IN ('submitted','reviewed','approved')`); }
  async down(q: QueryRunner) { await q.query(`DROP INDEX IF EXISTS "one_active_submission_per_request"`); }
}
