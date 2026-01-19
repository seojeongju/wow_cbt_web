# 작업 로그 (Work Log)
**작성일시**: 2026-01-16

## ✅ 금일 구현 내역 (Completed Tasks)
### 1. 모의고사 출제 옵션 기능 확장
- **경로**: `admin/mock-exam`
- **내용**:
  - 기존 '완전 랜덤', '카테고리별 균등 분배' 외에 **'카테고리별 문항수 지정(custom)'** 옵션 추가
  - 사용자가 각 카테고리별로 원하는 문제 개수를 직접 입력할 수 있는 UI 구현
  - 입력된 수량에 맞춰 랜덤하게 문제를 추출하는 로직(`ExamService.generateMockExam`) 구현 및 타입 정의 업데이트

### 2. 학생 정보 수정 및 모의고사 리스트 개선
- **경로**: `student/profile`, `student/exams`
- **내용**:
  - 학생 프로필 수정 페이지 구현 (비밀번호 변경 포함)
  - 대시보드 헤더에 '내 정보' 버튼 추가
  - 모의고사 리스트 UI 개선:
    - 응시 상태에 따른 배지 표시 (합격/불합격/점수)
    - 재응시 버튼 디자인 차별화 (가독성 개선)
    - 응시 여부(전체/응시완료/미응시) 필터링 기능 추가

## 📦 배포 및 저장소 정보 (Deployment & Repository)
- **배포 URL**: [https://wow-cbt-webmain.pages.dev/admin/mock-exam](https://wow-cbt-webmain.pages.dev/admin/mock-exam)
- **GitHub 저장소**: [https://github.com/seojeongju/wow_cbt_web](https://github.com/seojeongju/wow_cbt_web) (메인 브랜치: `main`)


**작성일시**: 2026-01-19

## ✅ 금일 구현 내역 (Completed Tasks)
### 1. 모의고사 카테고리별 문제 정렬 기능 구현
- **경로**: `admin/mock-exam`, `functions/api/exams`
- **내용**:
  - 모의고사 생성 시('미리보기' 단계 전), 선택된 문제들이 카테고리 이름순으로 자동 정렬되도록 로직 추가 (`MockExamGenerator.tsx`)
  - 학생이 시험 응시 시(`ExamPlayer`), 문제들이 카테고리순으로 먼저 정렬되고 그 후 생성일순으로 정렬되도록 백엔드 쿼리 수정 (`[id].js`)
  - 이를 통해 출제자와 응시자 모두에게 일관된 카테고리별 문제 구성을 제공

## 📦 배포 및 저장소 정보 (Deployment & Repository)
- **배포 URL**: [https://wow-cbt-webmain.pages.dev](https://wow-cbt-webmain.pages.dev)
- **GitHub 저장소**: [https://github.com/seojeongju/wow_cbt_web](https://github.com/seojeongju/wow_cbt_web)

## 📝 다음 작업 계획 (Next Steps)
1. **모니터링**: 배포 후 정렬 기능이 정상적으로 작동하는지 확인

### 2. 관리자 시험지 목록 필터 및 수정 기능 개선
- **경로**: `admin/questions`
- **내용**:
  - 시험지 선택 필터에 '전체 시험지 보기(ALL_EXAMS)' 옵션 추가 (과목 미분류 시험지 또는 특정 과목에 속하지 않은 시험지 조회 가능)
  - 시험지 목록 필터링 로직 개선 (과목 ID가 없는 경우 과목명으로 매칭, 전체 보기 시 필터 해제)
  - 시험지 생성 및 수정 모달에 '소분류(Topic)', '차시(Round)' 입력/수정 필드 추가
  - 시험지 수정 시 과목(Subject)이 비워지면 DB에서 subject_id를 null로 업데이트하도록 로직 수정
