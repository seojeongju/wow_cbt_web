# 데이터베이스 체계 및 구성 명세서 (Database Specification)

본 문서는 **WOW-CBT(Computer Based Testing) 시스템**의 데이터베이스 구성 및 소재의 체계적 배열 상태를 증명하기 위한 자료입니다.

## 1. 데이터베이스 개요
- **시스템 명칭**: WOW-CBT (웹 성능 기반 문제은행 시스템)
- **데이터 저장 모델**: 관계형 데이터베이스 (RDBMS)
- **논리적 구성**: 강좌(Course) - 과목(Category) - 시험(Exam) - 문항(Question) - 결과(Result)로 이어지는 계층적 구조

## 2. 테이블 상세 구성 (데이터 사전)

### 2.1 사용자 관리 (users)
시스템 접근 권한 및 학습자/관리자 식별 정보를 관리합니다.
| 필드명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | 고유 식별자 |
| email | TEXT | UNIQUE, NOT NULL | 로그인 계정 (이메일) |
| password | TEXT | NOT NULL | 인증 암호 (Bcrypt Hash) |
| name | TEXT | NOT NULL | 사용자 실명 |
| role | TEXT | CHECK (student, admin) | 권한 등급 |
| approved | INTEGER | DEFAULT 0 | 가입 승인 여부 (0:대기, 1:승인) |

### 2.2 강좌 관리 (courses)
자격증 또는 교육 과정의 대분류를 관리합니다.
| 필드명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | 강좌 고유 코드 |
| name | TEXT | UNIQUE, NOT NULL | 강좌 명칭 (예: 3D프린터운용기능사) |

### 2.3 시험 관리 (exams)
특정 강좌에 귀속된 개별 시험 세트를 관리합니다.
| 필드명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | 시험 회차 코드 |
| title | TEXT | NOT NULL | 시험 제목 (예: 2024년 모의고사 1회) |
| course_id | TEXT | FOREIGN KEY | 소속 강좌 ID |
| time_limit | INTEGER | DEFAULT 60 | 시험 제한 시간 (분) |
| pass_score | INTEGER | DEFAULT 60 | 합격 기준 점수 |

### 2.4 문항 및 소재 관리 (questions)
실제 지적 자산인 시험 문항 및 관련 소재(텍스트, 이미지 경로)를 관리합니다. **(핵심 소재 데이터 집합)**
| 필드명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | TEXT | PRIMARY KEY | 문항 고유 코드 |
| exam_id | TEXT | FOREIGN KEY | 소속 시험 ID |
| category | TEXT | | 세부 과목명 (예: 3D형상모델링) |
| text | TEXT | NOT NULL | 문제 본문 (지문 소재) |
| options | TEXT | JSON (Array) | 보기 목록 (4지 선다 소재) |
| correct_answer | TEXT | NOT NULL | 정답 번호 및 해설 매칭용 |
| explanation | TEXT | | 문항 상세 해설 소재 |
| image_url | TEXT | | 관련 도면 또는 이미지 소재 경로 |

## 3. 소재의 체계적 배열 특징
1.  **계층적 분류**: 모든 문항은 국가직무능력표준(NCS) 또는 국가자격시험 출제 기준에 따라 강좌-시험-과목 단위로 체계적으로 분류되어 저장됩니다.
2.  **구조화된 데이터**: 문항 데이터는 단순 텍스트가 아닌 JSON 포맷을 통한 구조화(Structured Data)를 거쳐, 보기가 가변적으로 변하더라도 체계적 접근이 가능하도록 설계되었습니다.
3.  **검색 및 접근성**: 각 소재는 고유 코드(UUID/Code)를 부여받아 독립적 접근이 가능하며, SQL Query를 통해 특정 난이도, 특정 과목, 특정 키워드별로 즉각적인 검색 및 추출이 가능합니다.
