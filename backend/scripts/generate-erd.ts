/**
 * ERD 생성 스크립트
 *
 * TypeORM Entity 정보를 기반으로 ERD 문서를 생성합니다.
 * - Mermaid ERD 다이어그램 (Markdown)
 * - 테이블 명세서 (Markdown)
 * - HTML 뷰어
 *
 * 사용법: npm run generate:erd
 */

import * as fs from 'fs';
import * as path from 'path';

// 타입 정의
interface Column {
  name: string;
  type: string;
  pk?: boolean;
  unique?: boolean;
  nullable?: boolean;
  fk?: string;
  description: string;
}

interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
}

interface Entity {
  tableName: string;
  description: string;
  columns: Column[];
  indexes?: Index[];
}

// Entity 정의
const entities: Record<string, Entity> = {
  users: {
    tableName: 'users',
    description: '사용자 (1차/2차+ 협력사)',
    columns: [
      { name: 'id', type: 'UUID', pk: true, description: '사용자 ID' },
      { name: 'email', type: 'VARCHAR', unique: true, description: '이메일' },
      { name: 'password', type: 'VARCHAR', description: '비밀번호 (해시)' },
      { name: 'name', type: 'VARCHAR', description: '사용자 이름' },
      {
        name: 'role',
        type: 'ENUM',
        description: '역할 (tier1_supplier, tier2plus_supplier)',
      },
      {
        name: 'parent_supplier_id',
        type: 'UUID',
        nullable: true,
        fk: 'users.id',
        description: '상위 협력사 ID (2차+ 협력사인 경우)',
      },
      { name: 'created_at', type: 'TIMESTAMP', description: '생성일시' },
      { name: 'updated_at', type: 'TIMESTAMP', description: '수정일시' },
    ],
    indexes: [{ name: 'UQ_users_email', columns: ['email'], unique: true }],
  },
  upload_requests: {
    tableName: 'upload_requests',
    description: 'LCA 데이터 업로드 요청',
    columns: [
      { name: 'id', type: 'UUID', pk: true, description: '요청 ID' },
      {
        name: 'tier1_supplier_id',
        type: 'UUID',
        fk: 'users.id',
        description: '1차 협력사 ID (요청자)',
      },
      {
        name: 'tier2plus_supplier_id',
        type: 'UUID',
        fk: 'users.id',
        description: '2차+ 협력사 ID (수신자)',
      },
      { name: 'product_name', type: 'VARCHAR', description: '제품명' },
      {
        name: 'description',
        type: 'TEXT',
        nullable: true,
        description: '요청 설명',
      },
      { name: 'deadline', type: 'DATE', description: '마감일' },
      {
        name: 'status',
        type: 'ENUM',
        description: '상태 (pending, in_progress, completed, cancelled)',
      },
      {
        name: 'priority',
        type: 'ENUM',
        description: '우선순위 (high, medium, low)',
      },
      {
        name: 'lca_methodology',
        type: 'ENUM',
        description: 'LCA 방법론 (iso_14040, ghg_protocol, pas_2050, custom)',
      },
      {
        name: 'system_boundary',
        type: 'ENUM',
        description:
          '시스템 경계 (cradle_to_gate, cradle_to_grave, gate_to_gate, gate_to_grave)',
      },
      {
        name: 'functional_unit',
        type: 'TEXT',
        nullable: true,
        description: '기능 단위',
      },
      {
        name: 'required_stages',
        type: 'JSON',
        nullable: true,
        description: '필요 Life Cycle Stages',
      },
      {
        name: 'impact_categories',
        type: 'JSON',
        nullable: true,
        description: '영향 범위',
      },
      { name: 'created_at', type: 'TIMESTAMP', description: '생성일시' },
      { name: 'updated_at', type: 'TIMESTAMP', description: '수정일시' },
    ],
    indexes: [
      { name: 'idx_upload_requests_tier1_supplier', columns: ['tier1_supplier_id'] },
      { name: 'idx_upload_requests_tier2plus_supplier', columns: ['tier2plus_supplier_id'] },
      { name: 'idx_upload_requests_status', columns: ['status'] },
      { name: 'idx_upload_requests_deadline', columns: ['deadline'] },
    ],
  },
  lca_data: {
    tableName: 'lca_data',
    description: 'LCA 데이터',
    columns: [
      { name: 'id', type: 'UUID', pk: true, description: '데이터 ID' },
      {
        name: 'supplier_id',
        type: 'UUID',
        fk: 'users.id',
        description: '2차+ 협력사 ID (업로더)',
      },
      {
        name: 'tier1_supplier_id',
        type: 'UUID',
        fk: 'users.id',
        description: '1차 협력사 ID (소유자)',
      },
      {
        name: 'upload_request_id',
        type: 'UUID',
        nullable: true,
        fk: 'upload_requests.id',
        description: '업로드 요청 ID',
      },
      { name: 'product_name', type: 'VARCHAR', description: '제품명' },
      {
        name: 'file_path',
        type: 'VARCHAR',
        nullable: true,
        description: '파일 경로',
      },
      {
        name: 'file_name',
        type: 'VARCHAR',
        nullable: true,
        description: '파일명',
      },
      {
        name: 'file_size',
        type: 'INTEGER',
        nullable: true,
        description: '파일 크기',
      },
      {
        name: 'file_hash',
        type: 'VARCHAR',
        nullable: true,
        description: '파일 해시 (SHA-256)',
      },
      {
        name: 'inventory_data',
        type: 'JSON',
        nullable: true,
        description: 'Inventory Data',
      },
      {
        name: 'impact_assessment',
        type: 'JSON',
        nullable: true,
        description: 'Impact Assessment 결과',
      },
      {
        name: 'functional_unit',
        type: 'TEXT',
        nullable: true,
        description: '기능 단위',
      },
      {
        name: 'reference_year',
        type: 'TEXT',
        nullable: true,
        description: '기준년도',
      },
      {
        name: 'data_quality',
        type: 'TEXT',
        nullable: true,
        description: '데이터 품질',
      },
      {
        name: 'verification_status',
        type: 'ENUM',
        description: '검증 상태 (pending, verified, failed)',
      },
      {
        name: 'status',
        type: 'ENUM',
        description: '상태 (draft, submitted, reviewed, approved, rejected)',
      },
      { name: 'created_at', type: 'TIMESTAMP', description: '생성일시' },
      { name: 'updated_at', type: 'TIMESTAMP', description: '수정일시' },
    ],
    indexes: [
      { name: 'idx_lca_data_supplier', columns: ['supplier_id'] },
      { name: 'idx_lca_data_tier1_supplier', columns: ['tier1_supplier_id'] },
      { name: 'idx_lca_data_upload_request', columns: ['upload_request_id'] },
      { name: 'idx_lca_data_status', columns: ['status'] },
    ],
  },
  feedbacks: {
    tableName: 'feedbacks',
    description: '피드백',
    columns: [
      { name: 'id', type: 'UUID', pk: true, description: '피드백 ID' },
      {
        name: 'lca_data_id',
        type: 'UUID',
        fk: 'lca_data.id',
        description: 'LCA 데이터 ID',
      },
      {
        name: 'tier1_supplier_id',
        type: 'UUID',
        fk: 'users.id',
        description: '1차 협력사 ID (작성자)',
      },
      { name: 'content', type: 'TEXT', description: '피드백 내용' },
      {
        name: 'type',
        type: 'ENUM',
        description: '피드백 유형 (comment, approval, rejection)',
      },
      { name: 'created_at', type: 'TIMESTAMP', description: '생성일시' },
      { name: 'updated_at', type: 'TIMESTAMP', description: '수정일시' },
    ],
    indexes: [
      { name: 'idx_feedbacks_lca_data', columns: ['lca_data_id'] },
      { name: 'idx_feedbacks_tier1_supplier', columns: ['tier1_supplier_id'] },
    ],
  },
};

// Mermaid ERD 생성
function generateMermaidERD(): string {
  let mermaid = 'erDiagram\n';

  // 테이블 정의
  for (const [key, entity] of Object.entries(entities)) {
    mermaid += `    ${entity.tableName} {\n`;
    for (const col of entity.columns) {
      const pkMark = col.pk ? 'PK' : col.fk ? 'FK' : '';
      const nullMark = col.nullable ? '"nullable"' : '';
      mermaid += `        ${col.type} ${col.name} ${pkMark} ${nullMark}\n`;
    }
    mermaid += '    }\n\n';
  }

  // 관계 정의
  mermaid += '    %% Relationships\n';
  mermaid += '    users ||--o{ users : "parent_supplier"\n';
  mermaid += '    users ||--o{ upload_requests : "tier1_supplier"\n';
  mermaid += '    users ||--o{ upload_requests : "tier2plus_supplier"\n';
  mermaid += '    users ||--o{ lca_data : "supplier"\n';
  mermaid += '    users ||--o{ lca_data : "tier1_supplier"\n';
  mermaid += '    upload_requests ||--o{ lca_data : "upload_request"\n';
  mermaid += '    lca_data ||--o{ feedbacks : "lca_data"\n';
  mermaid += '    users ||--o{ feedbacks : "tier1_supplier"\n';

  return mermaid;
}

// 테이블 명세서 생성
function generateTableSpec(): string {
  let spec = '# Database Schema Specification\n\n';
  spec += `Generated at: ${new Date().toISOString()}\n\n`;
  spec += '---\n\n';

  for (const [key, entity] of Object.entries(entities)) {
    spec += `## ${entity.tableName}\n\n`;
    spec += `**Description**: ${entity.description}\n\n`;

    // Columns
    spec += '### Columns\n\n';
    spec += '| Column | Type | Nullable | PK/FK | Description |\n';
    spec += '|--------|------|----------|-------|-------------|\n';
    for (const col of entity.columns) {
      const nullable = col.nullable ? 'Yes' : 'No';
      const key = col.pk ? 'PK' : col.fk ? `FK → ${col.fk}` : '-';
      spec += `| ${col.name} | ${col.type} | ${nullable} | ${key} | ${col.description} |\n`;
    }
    spec += '\n';

    // Indexes
    if (entity.indexes && entity.indexes.length > 0) {
      spec += '### Indexes\n\n';
      spec += '| Name | Columns | Unique |\n';
      spec += '|------|---------|--------|\n';
      for (const idx of entity.indexes) {
        const unique = idx.unique ? 'Yes' : 'No';
        spec += `| ${idx.name} | ${idx.columns.join(', ')} | ${unique} |\n`;
      }
      spec += '\n';
    }

    spec += '---\n\n';
  }

  return spec;
}

// HTML 뷰어 생성
function generateHTMLViewer(mermaidCode: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OEM-Trace ERD</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .mermaid {
            text-align: center;
            margin: 20px 0;
        }
        .info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OEM-Trace Database ERD</h1>
        <div class="info">
            <p><strong>Project:</strong> OEM-Trace LCA Data Management System</p>
            <p class="timestamp"><strong>Generated:</strong> ${new Date().toISOString()}</p>
        </div>
        <div class="mermaid">
${mermaidCode}
        </div>
    </div>
    <script>
        mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
</body>
</html>`;
}

// ERD 마크다운 생성
function generateERDMarkdown(mermaidCode: string): string {
  return `# OEM-Trace Database ERD

Generated at: ${new Date().toISOString()}

## Entity Relationship Diagram

\`\`\`mermaid
${mermaidCode}
\`\`\`

## Table Summary

| Table | Description | Columns | Indexes |
|-------|-------------|---------|---------|
| users | 사용자 (1차/2차+ 협력사) | 8 | 1 |
| upload_requests | LCA 데이터 업로드 요청 | 15 | 4 |
| lca_data | LCA 데이터 | 18 | 4 |
| feedbacks | 피드백 | 7 | 2 |

## Relationships

- **users → users**: Self-referencing (parent_supplier_id)
- **users → upload_requests**: 1차 협력사가 요청 생성
- **users → upload_requests**: 2차+ 협력사가 요청 수신
- **users → lca_data**: 2차+ 협력사가 데이터 업로드
- **users → lca_data**: 1차 협력사가 데이터 소유
- **upload_requests → lca_data**: 요청에 대한 데이터 제출
- **lca_data → feedbacks**: 데이터에 대한 피드백
- **users → feedbacks**: 1차 협력사가 피드백 작성
`;
}

// 메인 실행
async function main() {
  console.log('🚀 ERD 생성 시작...\n');

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Mermaid ERD 생성
  const mermaidCode = generateMermaidERD();

  // ERD Markdown 생성
  const erdMarkdown = generateERDMarkdown(mermaidCode);
  const erdPath = path.join(docsDir, 'ERD.md');
  fs.writeFileSync(erdPath, erdMarkdown);
  console.log(`✅ ERD.md 생성 완료: ${erdPath}`);

  // 테이블 명세서 생성
  const tableSpec = generateTableSpec();
  const specPath = path.join(docsDir, 'DATABASE.md');
  fs.writeFileSync(specPath, tableSpec);
  console.log(`✅ DATABASE.md 생성 완료: ${specPath}`);

  // HTML 뷰어 생성
  const htmlViewer = generateHTMLViewer(mermaidCode);
  const htmlPath = path.join(docsDir, 'erd.html');
  fs.writeFileSync(htmlPath, htmlViewer);
  console.log(`✅ erd.html 생성 완료: ${htmlPath}`);

  console.log('\n🎉 ERD 생성 완료!');
  console.log(`\n📁 생성된 파일:`);
  console.log(`   - docs/ERD.md       : Mermaid ERD 다이어그램`);
  console.log(`   - docs/DATABASE.md  : 테이블 명세서`);
  console.log(`   - docs/erd.html     : 인터랙티브 HTML 뷰어`);
}

main().catch(console.error);
