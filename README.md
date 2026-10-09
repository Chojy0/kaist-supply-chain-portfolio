# TRACE

협력사가 LCA 증빙을 주고받고 검토 결과를 남기는 공급망 자료 관리 프로젝트입니다.

요청자는 자료 요청과 승인·보완 의견을 작성합니다. 제출자는 파일 또는 JSON 데이터를 제출하고, 보완 요청을 받으면 새 자료를 다시 제출합니다. 이전 제출본과 검토 이력은 보관됩니다.

## 실행

Node.js 22 이상과 PostgreSQL 14 이상이 설치된 macOS/Linux에서 저장소 루트의 다음 명령을 실행합니다. PostgreSQL의 `initdb`, `pg_ctl`, `psql`, `createdb`가 PATH에 있어야 합니다.

```sh
node scripts/demo.mjs
```

[로컬 시연](http://127.0.0.1:5179)을 엽니다. 실행기는 별도 로컬 DB와 임의의 JWT 키를 만들고 필요한 패키지를 설치합니다. Ctrl+C로 종료하며 시연 데이터는 `.demo/`에 남습니다.

- 요청자: `tier1@test.com` / `password123`
- 제출자: `tier2@test.com` / `password123`

화면의 계정 입력 버튼으로 전환할 수 있습니다. 요청 생성 → 제출 → 보완 요청 → 재제출 → 승인 순서로 확인하세요. 시연 계정은 로컬에서만 사용합니다.

## 구성

- `frontend/`: React · TypeScript 화면
- `backend/`: NestJS · PostgreSQL API, 테스트, 마이그레이션
- `scripts/`: 로컬 시연 실행기

원래 프로젝트의 자료 수집·검토 흐름을 바탕으로, 제출용 정리 과정에서 화면과 접근 제어를 보완했습니다. Hedera testnet 해시 등록은 후속 추가 기능이며 기본적으로 꺼져 있습니다. 실제 거래는 아직 검증하지 않았습니다. [연동 범위와 설정](backend/docs/HEDERA.md)을 참고하세요.

탄소배출량 자동 계산이나 환경 인증을 제공하는 서비스는 아닙니다. 공개 운영용 배포와 외부 계정 관리는 이 로컬 시연의 범위에 포함하지 않습니다.

## 검증

```sh
cd backend
npm run build
npm test -- --runInBand
node scripts/verify-demo.mjs # 실행 중인 로컬 API에 시연 데이터를 추가해 검사
```

프론트엔드는 `frontend/`에서 `npm run build`로 확인합니다. CI는 빌드, 단위 테스트, 빈 DB 마이그레이션과 실제 HTTP 흐름을 검사하도록 구성했습니다.
