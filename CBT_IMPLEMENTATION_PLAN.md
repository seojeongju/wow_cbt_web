# CBT 필기시험 독립 운영 개발 계획서

## 1. 추진 배경
- 기존 문제풀이 기능은 학습 중심이며, CBT 필기시험은 실전 응시 중심 요구가 다름
- 시험 세션/타이머/자동제출/결과확정은 학습 모드와 분리 운영이 필요
- 운영 안정성을 위해 CBT를 별도 모듈로 분리하고, 기존 기능과 충돌을 차단

## 2. 목표
- 문제풀이 기능과 완전히 분리된 CBT 응시 플로우 구축
- 별도 데이터 저장소(테이블), 별도 API, 별도 화면/라우트로 독립성 확보
- 실전성(시간제한, 자동저장, 제출확정, 결과이력) 보장

## 3. 구현 범위 (1차)
- CBT 안내 페이지
- CBT 시험 목록/응시 시작
- CBT 응시 플레이어(OMR 이동, 답안 선택, 자동 저장)
- CBT 제출/채점/결과 저장
- CBT 응시 이력 조회

## 4. 설계 원칙
- 운영 분리: 기존 `exams`, `exam_results`와 별도 `cbt_*` 테이블 사용
- 경로 분리: `/student/cbt/*` 라우트로 분리
- 서비스 분리: `CbtService`로 API 호출 분리
- 회복성: 응시 중 저장된 답안 복구 지원

## 5. 데이터 모델
- `cbt_exams`: CBT 시험 메타 정보
- `cbt_exam_questions`: CBT 시험-문항 매핑
- `cbt_attempts`: 응시 세션 상태/답안 저장
- `cbt_results`: 제출 확정 결과

## 6. API 목록
- `GET /api/cbt/exams`
- `GET /api/cbt/exams/:id`
- `POST /api/cbt/attempts`
- `GET /api/cbt/attempts/:id`
- `PUT /api/cbt/attempts/:id/answers`
- `POST /api/cbt/attempts/:id/submit`
- `GET /api/cbt/results?userId=...`

## 7. 화면 구성
- `CBTGuidePage`: 응시 안내/주의사항
- `CbtExamSelectPage`: CBT 시험 선택/응시 시작
- `CbtExamPlayer`: 실전 응시 화면
- `CbtHistoryPage`: CBT 응시 이력

## 8. 운영 체크리스트
- DB 마이그레이션 적용 후 기본 CBT 시험 데이터 1세트 등록
- 응시 종료 정책(강제 종료, 중복 응시 허용 여부) 확정
- 동시 응시 부하 테스트 진행
- 관리자용 CBT 시험 편집 UI는 2차 범위로 확장
