# Step 0: design-tokens

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `docs/UI_GUIDE.md`
- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `concept.jpg` — 프로젝트 루트에 있는 이미지 파일. 반드시 Read 도구로 열어 색상·레이아웃을 직접 확인하라.

## 작업

`concept.jpg`는 이 프로젝트의 디자인 컨셉 레퍼런스다. 이 이미지를 분석해 색상 시스템을 추출하고 Tailwind 설정에 반영한다. **라이트 모드** 기반 디자인이다.

### concept.jpg에서 추출한 색상 시스템

이미지를 직접 확인하고 아래 토큰을 tailwind 커스텀 색상으로 등록한다:

| 토큰 이름 | 용도 | 참고값 |
|-----------|------|--------|
| `surface` | 페이지 배경 | zinc-50 계열 (#f4f4f5) |
| `card` | 카드 배경 | #ffffff |
| `border` | 카드/입력 테두리 | zinc-200 계열 |
| `text-primary` | 주 텍스트 | zinc-900 계열 |
| `text-secondary` | 보조 텍스트 | zinc-500 계열 |
| `text-muted` | 비활성 텍스트 | zinc-400 계열 |
| `badge-free` | 무료 배지 bg | green-100 계열 |
| `badge-free-text` | 무료 배지 text | green-700 계열 |
| `cta` | 터미널 버튼 bg | zinc-900 |
| `cta-text` | 터미널 버튼 text | #ffffff |

### 1. `frontend/tailwind.config.js` 수정

`theme.extend.colors`에 위 토큰을 추가한다. 기존 content 설정은 유지한다.

```js
theme: {
  extend: {
    colors: {
      surface: '#f4f4f5',
      card: '#ffffff',
      // ... concept.jpg에서 읽은 실제 값으로 채울 것
    },
    fontFamily: {
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    },
  },
},
```

### 2. `frontend/src/index.css` 수정

기존 Tailwind 디렉티브는 유지하고, 아래 CSS 변수와 전역 스타일을 추가한다:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    /* 라이트 모드 고정 — 시스템 설정 무시 */
    background-color: #f4f4f5;
    color: #18181b;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* 터미널 스타일 버튼용 monospace */
  .font-terminal {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  }
}

@layer components {
  /* concept.jpg의 카드 스타일 */
  .mp-card {
    @apply bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow;
  }

  /* concept.jpg의 터미널 CTA 버튼 */
  .mp-btn-terminal {
    @apply bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded-lg
           hover:bg-zinc-700 transition-colors flex items-center gap-2;
  }

  /* 필터 탭 — 활성 */
  .mp-tab-active {
    @apply bg-zinc-900 text-white text-sm font-medium px-4 py-1.5 rounded-full;
  }

  /* 필터 탭 — 비활성 */
  .mp-tab-inactive {
    @apply text-zinc-500 text-sm hover:text-zinc-900 px-4 py-1.5 rounded-full
           hover:bg-zinc-100 transition-colors;
  }

  /* 배지 — 무료/사용가능 */
  .mp-badge-free {
    @apply bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full font-medium;
  }

  /* 배지 — 유료 */
  .mp-badge-paid {
    @apply bg-zinc-100 text-zinc-600 border border-zinc-200 text-xs px-2 py-0.5 rounded-full font-medium;
  }
}
```

### 3. `docs/UI_GUIDE.md` 업데이트

concept.jpg 기반으로 색상 섹션을 실제 값으로 업데이트한다:

- 배경: `#f4f4f5` (페이지), `#ffffff` (카드)
- 텍스트: `#18181b` (주), `#71717a` (보조), `#a1a1aa` (비활성)
- 테두리: `#e4e4e7`
- 터미널 버튼: `bg-zinc-900 text-white font-mono`
- 기존 다크 모드 색상 섹션을 라이트 모드로 교체

## Acceptance Criteria

```bash
cd frontend && npm run build
```

타입 에러 없이 빌드 성공해야 한다.

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 체크리스트:
   - `tailwind.config.js`에 커스텀 색상 토큰이 추가되었는가?
   - `index.css`에 `.mp-card`, `.mp-btn-terminal`, `.mp-tab-active` 클래스가 정의되었는가?
   - `docs/UI_GUIDE.md`가 라이트 모드 색상으로 업데이트되었는가?
3. 결과에 따라 `phases/1-frontend-redesign/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Tailwind 라이트 모드 색상 토큰 + mp-card/mp-btn-terminal/mp-tab CSS 컴포넌트 클래스 추가, UI_GUIDE.md 업데이트 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 기존 `frontend/src/` 컴포넌트 파일을 이 step에서 수정하지 마라. 이유: 이 step은 토큰/CSS 설정만 담당한다.
- 다크 모드 (`dark:` prefix) Tailwind 클래스를 새로 추가하지 마라. 이유: concept.jpg는 라이트 모드 고정이다.
- `concept.jpg`를 읽지 않고 임의로 색상값을 추측하지 마라. 이유: 색상 기준은 반드시 이미지에서 추출해야 한다.
- 기존 테스트를 깨뜨리지 마라.
