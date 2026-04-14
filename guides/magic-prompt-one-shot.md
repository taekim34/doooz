# DOOOZ 마법의 프롬프트 — 한번에 만들기

> AI에게 이 전체 내용을 복사해서 붙여넣으면 됩니다.
> Claude, ChatGPT, Gemini 등 어떤 AI든 사용 가능합니다.

---

## 프롬프트 시작

```
나는 초등학생이고, 우리 가족이 함께 쓸 "할일 앱"을 만들고 싶어.
AI 너가 처음부터 끝까지 만들어줘. 내가 할 일은 최소한으로 알려줘.

### 앱 이름: DOOOZ (두즈)

### 어떤 앱인지:
- 부모가 아이들에게 할일을 등록해 (예: 양치하기, 책읽기)
- 아이들이 할일을 완료하면 체크 → 포인트를 받아
- 포인트를 모으면 보상과 교환할 수 있어 (예: 아이스크림, 게임 30분)
- 레벨이 올라가고(30단계), 배지도 모을 수 있어(60개)
- 캐릭터가 성장해 (병아리→루키→용사→영웅→전설, 5단계)
- 아이가 "조르기"로 추가 할일을 요청할 수 있어
- 매일 저녁 9시에 "오늘 할일 남았어!" 푸시 알림이 와
- 새벽 1시에 못한 할일은 자동으로 -50포인트 벌점
- 한국어, 일본어, 영어 3개 언어 지원
- 스마트폰 홈 화면에 앱처럼 설치 가능 (PWA)

### 기술 스택 (이대로 써줘):
- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS (스타일링)
- Supabase (데이터베이스 + 로그인 + 보안)
- Zod (데이터 검증)
- Web Push API (푸시 알림)
- Vercel (배포)

### 데이터베이스 테이블 (Supabase):

1. **families** — 가족 정보
   - id (UUID), name (가족이름, unique), invite_code (초대코드, 4~20자), timezone, locale (ko/ja/en)

2. **users** — 가족 구성원
   - id (UUID, auth.users 연결), family_id (FK→families), name, role (parent/child), character_id, current_balance, lifetime_earned, level

3. **task_templates** — 할일 템플릿 (반복/1회성)
   - id, family_id, title, points, assignee_id, recurrence (JSONB: {kind:'weekly', days:[0-6]} 또는 {kind:'once', due_date:'YYYY-MM-DD'}), is_active, start_date, end_date

4. **task_instances** — 매일 생성되는 할일 인스턴스
   - id, template_id (nullable FK), family_id, assignee_id, title, points, due_date, status (pending/completed/overdue/pardoned/requested/rejected), completed_at

5. **point_transactions** — 포인트 원장 (append-only, 절대 수정/삭제 금지!)
   - id, user_id, family_id, amount, kind (task_reward/penalty/adjustment/redemption), description, related_task_id

6. **rewards** — 보상 목록
   - id, family_id, title, cost, is_active

7. **reward_requests** — 보상 신청
   - id, reward_id, requested_by, family_id, status (pending/approved/rejected), reviewed_by

8. **badges** — 배지 정의 (seed 데이터)
   - id, key, emoji, name, description, rule_type, rule_value, sort_order

9. **user_badges** — 유저 배지 획득
   - user_id, badge_id, earned_at

10. **characters** — 캐릭터 정의 (seed 데이터, 12종)
    - id, key, name, stage1_emoji ~ stage5_emoji

11. **push_subscriptions** — 푸시 알림 구독
    - id, user_id, family_id, endpoint, keys (JSONB), created_at

### 보안 규칙 (매우 중요!):

1. **모든 테이블에 RLS(Row Level Security) 필수**
   - 같은 family_id 안에서만 데이터 접근 가능
   - 부모만 할일 추가/수정/삭제, 보상 관리, 조르기 승인/거절 가능
   - `auth_family_id()` 와 `auth_is_parent()` 헬퍼 함수 만들기

2. **Supabase 클라이언트 3종류 절대 혼용 금지**
   - server.ts (서버컴포넌트/액션) — RLS 적용
   - client.ts (클라이언트컴포넌트) — RLS 적용
   - admin.ts (cron job 전용) — RLS 무시, 일반 코드에서 사용하면 데이터 유출!

3. **point_transactions는 append-only** — INSERT만, UPDATE/DELETE 절대 금지
4. **완료된 할일은 수정 불가** (트리거로 차단)
5. **포인트 잔액(current_balance, lifetime_earned)은 직접 UPDATE 금지** — 트리거가 자동 계산

### 회원가입/로그인 흐름:

1. **첫 번째 부모**: 이메일 가입 → 이메일 인증 → 가족 만들기 (가족이름 + 초대코드 직접 설정 + 타임존 + 언어) → 캐릭터 선택
2. **다른 가족원**: 가족이름 + 초대코드 + 이름 + 비밀번호로 가입 → 캐릭터 선택
3. **로그인 2가지**: (A) 가족이름 + 이름 + 비밀번호 (B) 이메일 + 비밀번호 (부모용)
4. **아이 계정**: 실제 이메일 없이 합성 이메일 생성 (kid-{랜덤}@{familyId}.dooooz.invalid)

### 주요 화면:

**부모 화면:**
- 홈: 아이별 오늘 할일 진행률 + 최근 활동
- 할일 관리: 반복/1회성 분류, 종료된 할일 별도, 영구삭제 가능
- 할일 기록: 모든 날짜 수정 가능 (아이가 잘못 체크한 거 고칠 수 있음)
- 포인트: 아이별 분리된 포인트 내역
- 보상 관리: 보상 추가/수정/승인/거절
- 가족: 멤버 프로필 (레벨, 배지, 통계, 최근 활동)
- 설정: 가족이름 변경, 타임존, 언어, 비밀번호 변경

**아이 화면:**
- 홈: 오늘 할일 목록 + 체크 + 배지 표시
- 할일: 오늘 할일 체크/해제 + 조르기 버튼
- 할일 기록: 읽기전용 (칩 스타일 상태 라벨)
- 포인트: 내 포인트 내역
- 보상: 보상 목록 + 교환 신청
- 캐릭터: 레벨 + 캐릭터 스테이지 프로그레스 + 배지 도감 (달성 조건 표시)

### 할일 상태 전환:
- pending → completed (체크, 멱등)
- pending → overdue (새벽 1시 자동)
- overdue → pardoned (부모 봐주기, +50 포인트 복구)
- pardoned → overdue (봐주기 취소, 포인트 복구분 삭제)
- completed → pending (체크 해제 — 배지 회수됨!)
- requested → pending (조르기 승인) / deleted (취소/거절)

### Cron Job 2개 (Vercel):
1. 매일 21:00 KST — 미완료 할일 있는 아이에게 푸시 리마인더
2. 매일 01:00 KST — 미완료 할일 overdue 처리 + -50pt 벌점 + 오늘 할일 자동 생성

### 푸시 알림 시나리오:
- 조르기 요청/취소 → 부모에게
- 조르기 승인/거절 → 아이에게
- 보상 승인/거절 → 아이에게
- 저녁 9시 리마인더 → 미완료 할일 있는 아이에게

### 다국어 (i18n):
- 가족 단위로 언어 설정 (families.locale)
- 모든 UI 텍스트를 ko.json, ja.json, en.json 리소스 파일로 관리
- 소스 코드에 한국어/일본어 하드코딩 금지
- 로그인 전 화면에 언어 선택 드롭다운 (🇰🇷/🇯🇵/🇺🇸)

### 환경변수 (.env.example 제공):
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (필수)
- SUPABASE_SERVICE_ROLE_KEY (필수, 절대 클라이언트 노출 금지)
- NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (푸시용)
- CRON_SECRET (cron 인증용)
- NEXT_PUBLIC_SITE_URL (배포 도메인)
- 나머지는 기본값 있음 (앱이름, 테마색, 언어 등)

### 만들어야 할 것 순서:

1단계: 프로젝트 설정 (Next.js + Supabase + Tailwind)
2단계: 데이터베이스 스키마 + RLS + 트리거 + seed 데이터
3단계: 인증 (가입/로그인/온보딩)
4단계: 부모 화면 (할일 관리, 보상 관리)
5단계: 아이 화면 (할일 체크, 포인트, 캐릭터)
6단계: 조르기 기능
7단계: 푸시 알림 + PWA
8단계: Cron Job (리마인더 + 자동생성)
9단계: 다국어
10단계: 배포 (Vercel)

각 단계가 끝날 때마다 "다음 단계 진행할까?" 라고 물어봐.
코드를 줄 때는 파일 경로와 함께 전체 코드를 줘.
에러가 나면 내가 에러 메시지를 알려줄테니 고쳐줘.

시작하자!
```

---

## 사용 방법

1. 위 프롬프트 전체를 복사합니다
2. AI (Claude, ChatGPT 등)에 붙여넣기합니다
3. AI가 1단계부터 안내해줍니다
4. 각 단계 끝나면 "다음 단계 진행해" 라고 입력합니다
5. 에러가 나면 에러 메시지를 복사해서 AI에게 보여줍니다

### 필요한 사전 준비 (별도 가이드 참고)
- Node.js 설치
- Supabase 프로젝트 생성
- Vercel 계정 생성
- VAPID 키 생성
