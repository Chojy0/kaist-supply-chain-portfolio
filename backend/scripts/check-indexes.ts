/**
 * DB 인덱스 확인 스크립트
 * 사용법: npm run check:indexes
 */
import dataSource from '../src/config/database.config';

async function checkIndexes() {
  try {
    await dataSource.initialize();
    console.log('🔍 인덱스 확인 중...\n');

    const indexes = await dataSource.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'upload_requests', 'lca_data', 'feedbacks')
      ORDER BY tablename, indexname
    `);

    const grouped: Record<string, any[]> = {};
    for (const idx of indexes) {
      if (!grouped[idx.tablename]) {
        grouped[idx.tablename] = [];
      }
      grouped[idx.tablename].push(idx);
    }

    for (const [table, idxList] of Object.entries(grouped)) {
      console.log(`📋 ${table} (${idxList.length}개)`);
      for (const idx of idxList) {
        const isPK = idx.indexname.includes('pkey') || idx.indexname.startsWith('PK_');
        const isUnique = idx.indexdef.includes('UNIQUE');
        const tag = isPK ? '🔑 PK' : isUnique ? '🔒 UQ' : '📇 IDX';
        console.log(`   ${tag} ${idx.indexname}`);
      }
      console.log('');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

checkIndexes();
