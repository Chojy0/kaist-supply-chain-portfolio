# Hedera testnet 문서 무결성

승인된 자료의 파일 해시와 정규화한 JSON 해시를 HCS topic에 등록합니다. 원문·회사명은 게시하지 않습니다. 조회할 때 현재 파일과 데이터를 다시 해시한 뒤 미러 노드 기록과 비교합니다. 내용의 진실성이나 탄소 산정 정확도를 인증하지 않습니다.

기본값은 비활성입니다. 실제 testnet 계정과 미리 만든 topic이 있을 때만 서버에 다음 환경변수를 설정합니다. 개인키는 DER 형식이며 클라이언트나 저장소에 넣지 않습니다.

```
HEDERA_ENABLED=true
HEDERA_ACCOUNT_ID=
HEDERA_PRIVATE_KEY=
HEDERA_TOPIC_ID=
```

승인된 자료의 요청자만 등록할 수 있습니다. 화면에서 공개 testnet 등록에 명시적으로 동의해야 합니다. 키가 없는 로컬 시연에서는 등록 기능이 비활성으로 표시됩니다.

- POST /lca-data/:id/anchor: {"publishHash": true}
- GET /lca-data/:id/anchor: 등록 상태 및 해시 일치 조회

영수증 수신과 미러 노드 일치를 구분합니다. 전송 결과가 불확실하면 자동 재전송을 막고 confirmation_required 상태를 반환합니다. 원장 기록을 확인한 뒤 수동 복구해야 하며, 임의로 저장 행을 지우고 재전송하면 안 됩니다. 현재 한 제출본에는 한 번만 등록할 수 있습니다.

해시·권한·중복 방지·미러 노드 비교는 모의 테스트로 검증했습니다. 실제 testnet 거래는 미검증이며 mainnet은 지원하지 않습니다. 요청부터 승인까지 로컬 DB와 브라우저 흐름은 검증했습니다.

공식 참고: https://docs.hedera.com/native/consensus/submit-message
