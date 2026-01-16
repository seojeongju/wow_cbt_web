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

## 📝 다음 작업 계획 (Next Steps)
1. **기능 테스트**: 배포된 페이지에서 실제 '카테고리별 문항수 지정' 기능이 정상 작동하는지 확인
2. **피드백 반영**: 테스트 후 수정이 필요한 부분이 있다면 보완
