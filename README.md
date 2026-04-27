# 와우쓰리디 CBT 문제은행 (Wow3D CBT)

HRD교육센터(와우쓰리디홍대센터)를 위한 3D프린팅 자격증 대비 문제은행 시스템입니다.

## 🛠 기술 스택
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Modern Variables & Utilities)
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Deployment**: Cloudflare Pages

## 🚀 시작하기 (Getting Started)

### 1. 설치
```bash
npm install
```

### 2. 로컬 실행
```bash
npm run dev
```

## 🌐 배포 (Cloudflare Pages)

이 프로젝트는 Cloudflare Pages에 배포하기 최적화되어 있습니다.

1. **빌드**:
   ```bash
   npm run build
   ```
2. **배포 (Direct Upload)**:
   ```bash
   npx wrangler pages deploy dist
   ```

### 배포 후 스모크 체크 (CBT 관리자 API)
배포 URL 기준으로 CBT 관리자 핵심 API(조회/권한 가드)를 비파괴 방식으로 점검합니다.

```bash
npm run smoke:cbt-admin -- --base-url https://<your-pages-url>
```

또는:

```bash
BASE_URL=https://<your-pages-url> npm run smoke:cbt-admin
```

## 🎨 디자인 시스템
`src/index.css`에 정의된 CSS 변수를 사용하여 일관된 디자인을 유지합니다.
- Primary Color: `#3b82f6` (Blue)
- Accent Color: `#f59e0b` (Amber)
- Font: Inter, Outfit
