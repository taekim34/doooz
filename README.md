🌐 [한국어](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

# DOOOZ

잔소리는 그만. 응원을 시작하세요.

매주 아이들에게 할 일을 시키느라 몇 시간씩 잔소리하고 계신가요? 매일 반복되는 집안일이 전쟁터가 되고 있지 않나요? **DOOOZ**는 지루한 일상을 수년간 이어지는 모험으로 바꿔줍니다. 부모가 할 일을 정하면, 아이가 완료하고, 포인트가 쌓이고, 캐릭터가 성장하고, 연속 기록이 온 가족을 하나로 묶어줍니다.

아이의 성장을 5년 이상 지켜보고 싶은 가족을 위해 만들었습니다.

## 왜 DOOOZ인가 🤩 (👉 [상세 사용 가이드](./guides/user-guide.md))

부모가 할일을 등록하면 아이가 스스로 체크하고, 체크하는 순간 포인트가 바로 쌓입니다. 부모 승인을 기다릴 필요 없이 아이가 주도적으로 관리하는 구조입니다. 쌓인 포인트는 부모가 등록한 보상(용돈, 특별 활동 등)으로 교환할 수 있고, 30단계 레벨과 58종 배지, 5단계로 진화하는 캐릭터가 아이에게 지속적인 동기를 부여합니다.

| 기능               | 설명                                        |
| ---------------- | ----------------------------------------- |
| **자율 체크, 즉시 반영** | 아이가 할일을 체크하면 포인트가 바로 적립! 부모 승인 불필요        |
| **조르기**          | 아이가 추가로 한 일을 부모에게 인정 요청 → 부모가 포인트를 정해서 지급 |
| **봐주기**          | 여행이나 아픈 날, 부모가 미완료 할일의 패널티를 면제            |
| **보상 교환**        | 포인트로 보상(용돈 등) 교환 신청 → 부모 승인 시 차감          |
| **오래 가는 게임화**    | 30레벨 + 58배지 + 12캐릭터(5단계 진화) — 수년간 동기 부여   |
| **자동 운영**        | 새벽 1시 할일 자동 생성 + 미완료 패널티, 저녁 9시 리마인더      |
| **앱 설치 & 푸시**    | 홈 화면에 추가하면 별도 앱으로 사용 + 푸시 알림              |
| **가족 데이터 보호**    | 가족 간 데이터를 데이터베이스 레벨에서 완전 격리               |
| **다국어**          | 한국어 / English / 日本語 + 글로벌 타임존             |

> 💡 **앱 설치 팁 (iOS):** 로그인 후 메인 화면에서 홈 화면에 추가해주세요. 로그인 전에 설치하면 화면 레이아웃 문제가 발생할 수 있습니다.

## 스크린샷 📸

| ![가족 상세](./images/DOOOZ%20dashboard.jpeg) | ![할일 현황(1)](./images/DOOOZ%20tasks1.png) |
|:-----------------------------------------:|:----------------------------------------:|
| 가족 상세                                     | 할일 현황(1)                                 |

| ![할일 현황(2)](./images/DOOOZ%20tasks2.png) | ![보상 관리](./images/DOOOZ%20rewards.jpeg) |
|:----------------------------------------:|:---------------------------------------:|
| 할일 현황(2)                                 | 보상 관리                                   |

## 기술 스택 💡

- Next.js 15 (App Router, RSC) + React 19 + TypeScript 5
- Tailwind + shadcn 스타일 컴포넌트
- Supabase (Postgres, Auth, RLS)
- Zod 스키마 유효성 검사
- Web Push API (VAPID)
- Vercel 배포

## 미리 준비된 서비스 사용하기 🌐

### [👉 DOOOZ 서비스 링크](https://doooz.app)

DOOOZ는 이미지/파일 업로드 없이 텍스트 데이터만 저장하기 때문에 서버 비용이 매우 작습니다. 직접 구축 없이 바로 사용해보고 싶은 분은 위 주소에서 회원가입 후 사용하실 수 있습니다.

현재는 무료 tier로 운영 중이며, 가입된 가족이 100곳을 넘으면 Supabase를 유료 tier로, 5,000가족을 넘으면 Vercel도 유료 tier로 업그레이드할 예정입니다. (최대 약 15,000가족, 50,000명까지 수용 가능 예상)

다만, DOOOZ는 유저가 직접 자신만의 서비스를 구축하고 사용하는 것을 추천합니다. 아래 가이드를 참고하세요.

## 직접 구축 - 처음이신 분은 구글/AI에게 물어보세요 🔰

이 문서를 따라 하려면 약간의 개발 환경 설정이 필요합니다.

- **터미널 열기** — Mac은 터미널, Windows는 **PowerShell**을 사용하세요. 여는 법을 모르시면 구글에서 검색하거나 AI에게 물어보세요.
- **git이 안 된다면** — 구글에서 **"Git 설치 방법"** 을 검색하거나 AI에게 물어보세요.
- **npm/npx가 안 된다면** — 구글에서 **"Node.js 설치 방법"** 을 검색하거나 AI에게 물어보세요.

## 내 컴퓨터 터미널에서 실행하기 🖥️

```bash
# 1. 다운로드 받고 싶은 폴더로 이동 (예: 바탕화면)
cd ~/Desktop

# 2. 클론 & 설치
git clone https://github.com/taekim34/doooz.git
cd doooz && npm install

# 3. 환경 변수 (.env.example을 복사해서 .env.local 생성)
cp .env.example .env.local   # 아래 필수 값을 채워주세요

# 4. 개발 서버
npm run dev               # http://localhost:3000
```

### 환경 변수

복사된 `.env.local`에 필수값은 비워져 있습니다. 텍스트를 수정할 수 있는 프로그램으로 열고, 다음 섹션의 가이드에 따라 값을 채워주세요.

#### 필수 (로컬 실행에 필요한 값)

**1. Supabase 연결 정보** — [supabase.com](https://supabase.com)에서 프로젝트 생성 후, 좌측 메뉴 Project Settings → API Keys 에서 복사합니다.

| 변수                                     | 어디서 찾나요                                                 |
| -------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | 프로젝트 홈 → 프로젝트 이름 아래 표시된 URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (공개 키)                                  |
| `SUPABASE_SERVICE_SECRET_KEY`          | Secret key (⚠️ 이 키는 절대 외부에 공개하지 마세요)                    |

> **Supabase에 로컬 주소 등록** — Supabase Dashboard → Auth → URL Configuration에서:
> 
> - **Site URL**: `http://localhost:3000`
> - **Redirect URLs**: `http://localhost:3000` 하위 전체 경로 추가 (입력값: `http://localhost:3000/**`)
> 
> 이 설정이 없으면 로컬에서 로그인이 동작하지 않습니다.

**2. 사이트 주소** — 로컬에서는 아래 값을 그대로 사용하세요.

| 변수                     | 값                       |
| ---------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

**3. 푸시 알림 키** — 터미널에서 아래 명령어를 실행하면 2개의 키가 출력됩니다. 그대로 복사해서 붙여넣으세요.

```bash
npx web-push generate-vapid-keys
```

| 변수                             | 값               |
| ------------------------------ | --------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 출력된 Public Key  |
| `VAPID_PRIVATE_KEY`            | 출력된 Private Key |

**4. 크론 비밀번호** — 아무 비밀번호나 직접 만들어 넣으세요. 나중에 새 값으로 변경 가능합니다. (예: `my-secret-123`)

| 변수            | 값              |
| ------------- | -------------- |
| `CRON_SECRET` | 자유롭게 정한 비밀 문자열 |

> 여기까지 설정하면 `npm run dev`로 로컬에서 실행할 수 있습니다.
> 인터넷에 배포하려면 아래 "Vercel 배포" 섹션을 따라 하세요.

#### 선택 (`.env.example`에 기본값이 있으므로 그대로 써도 됩니다)

| 변수                                   | 기본값                             | 설명                                                                  |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`               | `DOOOZ`                         | 앱 표시 이름                                                             |
| `NEXT_PUBLIC_APP_DESCRIPTION`        | `Family tasks, points...`       | 앱 설명                                                                |
| `NEXT_PUBLIC_THEME_COLOR`            | `#7c3aed`                       | 앱 테마 색상                                                             |
| `NEXT_PUBLIC_DEFAULT_LOCALE`         | `en`                            | 기본 언어                                                               |
| `NEXT_PUBLIC_LOCALE_COOKIE`          | `doooz_locale`                  | 언어 설정 쿠키 이름                                                         |
| `NEXT_PUBLIC_SYNTHETIC_EMAIL_DOMAIN` | `dooooz.invalid`                | 아이 계정용 가짜 이메일 도메인 (실제 이메일 전송 없음). 사이트 도메인과 일치시킬 필요는 없지만 일관성을 위해 권장. |
| `VAPID_CONTACT_EMAIL`                | `mailto:noreply@dooooz.invalid` | 푸시 서비스 연락처 URI. 위와 동일 — 도메인 일치 권장이나 필수 아님.                          |
| `NEXT_PUBLIC_FAMILY_STORAGE_KEY`     | `doooz_family_name`             | 가족 이름용 localStorage 키                                               |

## 우리 가족 온라인 서비스 구축하기 🚀🔥

### 인터넷 배포 설정하기 (Vercel)

이 단계는 처음 한 번만 설정하면 다시 할 필요가 없습니다.

1. [vercel.com](https://vercel.com)에 무료 가입 후, 대시보드에서 **Add New → Project**로 새 프로젝트를 만듭니다. 이때 원하는 프로젝트 이름을 지정하면 `https://내프로젝트.vercel.app` 주소가 됩니다.

2. Vercel CLI를 설치합니다:
   
   ```bash
   npm i -g vercel
   ```

3. 터미널에서 doooz 소스가 있는 폴더로 이동합니다: `cd ~/Desktop/doooz` (다운로드 경로에 맞게 수정)

4. `vercel link`를 실행합니다. 로그인 후 "Link to existing project?"에 **Y**를 선택하고, 위에서 만든 프로젝트를 선택합니다.

5. 위에서 로컬에 설정한 환경 변수를 Vercel에도 등록합니다. 아래 명령을 **하나씩** 실행하세요. 명령을 치면 값을 입력하라는 프롬프트가 나옵니다. 값을 붙여넣고 Enter를 누르면 됩니다.
   
   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL production              # ⚠️ Vercel 배포 주소 입력 (예: https://내프로젝트.vercel.app)
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   vercel env add SUPABASE_SERVICE_SECRET_KEY production
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
   vercel env add VAPID_PRIVATE_KEY production
   vercel env add CRON_SECRET production
   ```
   
   > `NEXT_PUBLIC_SITE_URL`만 Vercel 배포 주소로 변경하고, 나머지는 로컬(`.env.local`)과 동일한 값을 넣으면 됩니다.

6. **Supabase에 배포 주소 등록** — Supabase Dashboard → Auth → URL Configuration:
   
   - **Site URL**: Vercel 배포 주소로 변경 (예: `https://내프로젝트.vercel.app`)
   - **Redirect URLs**: Vercel 배포 주소 하위 전체 경로 추가 (입력값: `https://내프로젝트.vercel.app/**`) — 로컬 단계에서 등록한 `localhost:3000`은 그대로 유지

### 배포하기 🥳

터미널에서 아래 명령을 입력하고 잠시 기다리면 DOOOZ 소스가 Vercel 서버로 배포됩니다.

```bash
vercel --prod
```

배포가 완료되면 나와 우리 가족들이 컴퓨터에서도, 모바일에서도 `https://내프로젝트.vercel.app` 으로 직접 접속할 수 있습니다!

이후 소스를 수정할 때마다 다시 `vercel --prod`로 배포하면 인터넷에 배포된 서비스가 업데이트됩니다.

### 개발 환경 구축하기

이 문서는 로컬 컴퓨터와 인터넷 배포 버전이 같은 환경을 바라보고 있습니다. 직접 소스를 수정, 개발하실 분들은 별도의 dev 환경을 구축하는 것을 추천합니다.

## 🎩 마법의 프롬프트 — 아이와 함께 만들어 보세요

비슷한 앱을 직접 만들어 보고 싶으신가요? AI 어시스턴트(Claude, ChatGPT, Gemini 등)에 프롬프트를 붙여넣으면 비슷한 앱을 처음부터 만들 수 있는 가이드를 준비했습니다.

### 사전 준비

AI 코딩 도구(Claude Code 등)를 사용하는 경우, Supabase MCP를 연결하면 AI가 데이터베이스를 직접 생성하고 관리할 수 있어 편리합니다. 특히 "Supabase best practices를 참고해서 만들어줘"라고 지시하면 데이터베이스를 잘 몰라도 Supabase 기반 환경을 안정적으로 구축하는 데 도움이 됩니다. Vercel CLI는 위 "인터넷 배포 설정하기" 단계에서 이미 설치되어 있습니다.

### 프롬프트

### [👉 한번에 만들기 프롬프트](./guides/magic-prompt-one-shot.md)

전체 프롬프트를 AI 채팅에 복사하면 한 번에 동작하는 앱이 완성됩니다.

### [👉 단계별 프롬프트](./guides/magic-prompt-steps.md)

안내에 따라 프롬프트를 하나씩 입력하며 단계적으로 앱을 만들어 갑니다.

아이와 함께 프롬프트를 따라 하면서 "내가 만든 앱"을 경험해 보세요.

## 주요 명령어 📜

| 명령어                 | 용도                                         |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | 내 컴퓨터에서 개발 서버 실행 (`http://localhost:3000`) |
| `npm run build`     | 배포 전 빌드 에러 확인                              |
| `npm run typecheck` | 타입 오류 검사                                   |
| `npm run lint`      | 코드 스타일 검사                                  |
| `vercel --prod`     | 인터넷에 배포                                    |

## 폴더 구조 📂

```
src/
├─ app/
│  ├─ (auth)/              로그인, 회원가입, 온보딩
│  ├─ (app)/               보호된 라우트 — 홈, 할 일, 포인트, 보상, 캐릭터, 가족, 설정
│  └─ api/                 라우트 핸들러 + 크론 (저녁 알림, 자정 롤오버)
├─ features/
│  ├─ auth/                requireUser, getCurrentAuth
│  ├─ tasks/               서버 액션 (수정, 봐주기)
│  ├─ children/            순위 계산
│  └─ characters/          이모지 맵
├─ lib/
│  ├─ supabase/            client, server, admin 클라이언트 + 타입 Database
│  ├─ datetime/            가족 시간대 유틸리티 + 주입 가능한 clock
│  ├─ i18n/                ko.json, ja.json, en.json + 번역 헬퍼
│  ├─ push/                웹 푸시 알림 전송
│  ├─ level.ts             L1-L30 임계값 계산
│  ├─ streak.ts            연속 일수 계산
│  └─ invariants.ts        I1-I10 원장 검증 헬퍼
├─ schemas/                Zod 스키마 (가족, 사용자, 할 일, 포인트, 보상, 뱃지)
└─ components/ui/          shadcn 스타일 기본 컴포넌트

supabase/
├─ migrations/             스키마, RLS, 트리거, 인덱스
└─ seed.sql                캐릭터 12개 + 뱃지 58개

tests/
├─ unit/                   소스 파일과 함께 위치
├─ integration/            RLS 매트릭스
└─ e2e/                    Playwright 시나리오
```

## 무료 tier 운영 가이드 💰

DOOOZ는 이미지/파일 업로드 없이 텍스트 데이터만 저장하기 때문에 리소스 사용량이 매우 적습니다. 1가족 = 부모 1명 + 아이 2~3명, 하루 할일 체크 10~15건 기준:

| 구간  | 월 비용   | 최대 가족 수 (예상)  | 구성                                                    |
| --- | ------ | ------------- | ----------------------------------------------------- |
| 무료  | `$0`   | **~200가족**    | Supabase Free + Vercel Free                           |
| 중규모 | ~`$27` | **~5,000가족**  | Supabase Pro (`$25`) + DB (`$2`) + Vercel Free        |
| 대규모 | ~`$50` | **~15,000가족** | Supabase Pro (`$25`) + DB (`$5`) + Vercel Pro (`$20`) |

- **1가족 전용**이면 무료 한도의 1~2%만 사용합니다.

### 규모가 커지면?

- **~200가족 초과** — DB 용량과 Supabase 동시접속 제한에 걸릴 수 있습니다. **Supabase Pro**로 업그레이드하고 추가 DB를 구매하세요.
- **~5,000가족 초과** — Vercel에서 매일 새벽 1시에 실행되는 할일 정리 작업(크론)에 병목이 생길 수 있습니다. **Vercel Pro**로 업그레이드하세요. Vercel Pro는 크론 작업 제한이 없어 더 많은 시간대나 글로벌 대응까지 구현 가능합니다.

### 모니터링 포인트

- **Supabase Dashboard → Settings → Billing**: 대역폭, DB 용량 확인
- **Vercel Dashboard → Usage**: 대역폭, 함수 실행 시간 확인

## 오픈소스 참여 환영합니다 🤝

DOOOZ는 누구나 참여할 수 있는 오픈소스 프로젝트입니다. 다음과 같은 분들의 기여를 환영합니다!

- 🎨 **디자이너** — UI/UX 개선에 도움을 주실 디자이너를 찾고 있습니다.
- 🌍 **다국어 & 글로벌 환경** — 새로운 언어 추가, 다양한 국가 환경에 맞는 개선을 환영합니다.
- 👨‍👩‍👧‍👦 **테스트 가족** — 앱을 매일 사용하며 적극적으로 테스트해주실 가족을 환영합니다. 이미 구축된 서비스를 제공해드릴 수 있습니다.

Issue나 Pull Request로 자유롭게 참여해주세요!

## 라이선스 📄

[Apache License 2.0](./LICENSE)
