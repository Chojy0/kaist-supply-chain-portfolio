import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddLcaAnchors1791525600000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`CREATE TABLE lca_anchors (id uuid PRIMARY KEY REFERENCES lca_data(id) ON DELETE CASCADE, hash varchar NOT NULL, status varchar NOT NULL DEFAULT 'submitting', "topicId" varchar, "sequenceNumber" varchar, "transactionId" varchar, "createdAt" timestamp NOT NULL DEFAULT now())`);
  }
  async down(r: QueryRunner): Promise<void> { await r.query('DROP TABLE lca_anchors'); }
}
