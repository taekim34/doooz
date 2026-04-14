# DOOOZ 마법의 프롬프트 — 단계별 세트

> 순서대로 하나씩 AI에게 입력합니다.
> 각 단계에서 AI가 코드를 주면 따라하고, 끝나면 다음 프롬프트를 입력합니다.

---

## 프롬프트 #0 — 프로젝트 소개

```
나는 초등학생이고, 가족 할일 앱을 만들고 싶어. 이름은 "DOOOZ"야.

기능 요약:
- 부모가 아이들에게 할일 등록 (반복/1회성)
- 아이가 완료하면 포인트 적립
- 포인트로 보상 교환
- 30단계 레벨, 60개 배지, 캐릭터 성장 (5단계)
- 아이가 "조르기"로 추가 할일 요청
- 매일 저녁 9시 푸시 알림, 새벽 1시 자동 벌점
- 한국어/일본어/영어 3개 언어
- 스마트폰 앱처럼 설치 가능 (PWA)

기술 스택: Next.js 15 + React 19 + TypeScript + Tailwind + Supabase + Vercel

이해했으면 "준비됐어!" 라고 말해줘.
그 다음부터 단계별로 같이 만들자.
```

---

## 프롬프트 #1 — 프로젝트 생성

```
1단계: 프로젝트를 만들어줘.

npx create-next-app@latest doooz 로 프로젝트를 만들고,
필요한 패키지를 설치해줘:

- @supabase/ssr, @supabase/supabase-js (데이터베이스)
- zod (데이터 검증)
- date-fns, date-fns-tz (날짜/시간)
- web-push (푸시 알림)
- lucide-react (아이콘)
- sonner (토스트 메시지)
- class-variance-authority, clsx, tailwind-merge (스타일)

tsconfig.json에 noUncheckedIndexedAccess: true 추가.
src/lib/, src/features/, src/schemas/, src/components/ui/ 폴더 만들어줘.
.env.example 파일도 만들어줘 (Supabase URL, Key, VAPID, CRON_SECRET 등).

전체 명령어와 파일을 알려줘!
```

---

## 프롬프트 #2 — 데이터베이스

```
2단계: Supabase 데이터베이스를 설계해줘.

테이블 11개:
- families (가족 - name unique, invite_code 4~20자, timezone, locale)
- users (구성원 - role: parent/child, character_id, 포인트/레벨 캐시)
- task_templates (할일 템플릿 - recurrence JSONB로 반복/1회성 구분)
- task_instances (매일 할일 - status: pending/completed/overdue/pardoned/requested/rejected)
- point_transactions (포인트 원장 - append-only! 수정/삭제 절대 금지)
- rewards, reward_requests (보상 시스템)
- badges, user_badges (배지 시스템)
- characters (캐릭터 12종)
- push_subscriptions (푸시 알림)

보안 규칙:
- 모든 테이블 RLS 활성화
- auth_family_id() 함수로 같은 가족만 접근
- auth_is_parent() 함수로 부모 전용 작업 보호
- point_transactions: 부모만 INSERT, 모든 가족원 SELECT
- task_instances: 부모는 CRUD, 아이는 requested INSERT + 본인 DELETE만

트리거:
- 포인트 INSERT시 → balance, lifetime_earned, level 자동 계산
- 완료된 할일 수정 차단

헬퍼 함수:
- calculate_level(포인트) → 1~30 레벨 반환
- ensure_today_instances() → 오늘 할일 자동 생성
- evaluate_badges(user_id) → 배지 달성 여부 체크 + 미달성 배지 회수

seed 데이터: 캐릭터 12종, 배지 60종 (할일 수, 연속, 포인트, 완벽한 하루/주/월/분기/년, 보상 교환, 얼리버드 등)

Supabase SQL 마이그레이션 파일로 만들어줘!
```

---

## 프롬프트 #3 — 인증 시스템

```
3단계: 로그인/회원가입을 만들어줘.

Supabase 클라이언트 3개 (절대 혼용 금지):
- src/lib/supabase/client.ts (브라우저용, RLS 적용)
- src/lib/supabase/server.ts (서버용, RLS 적용)
- src/lib/supabase/admin.ts (cron 전용, RLS 우회 — 다른 곳에서 쓰면 보안 사고!)

화면 4개:
1. /login — 탭으로 "가족이름 로그인" / "이메일 로그인" 선택
2. /signup — 이메일 가입 → "이메일 인증해주세요" 안내 페이지
3. /onboarding/create-family — 가족이름 + 초대코드 + 타임존 + 언어 설정
4. /onboarding/join-family — 가족이름 + 초대코드 + 이름 + 비밀번호

아이 계정은 실제 이메일 없이 합성 이메일 생성:
kid-{랜덤}@{familyId}.dooooz.invalid

미들웨어:
- 로그인 안 한 사람이 앱에 접근하면 /login으로
- 캐릭터 안 고른 사람은 /onboarding/pick-character로

모든 텍스트는 i18n 리소스 파일(ko.json 등)로!
로그인 전 화면에 언어 선택 드롭다운 (🇰🇷/🇯🇵/🇺🇸) 추가.
```

---

## 프롬프트 #4 — 할일 관리 (부모)

```
4단계: 부모의 할일 관리 화면을 만들어줘.

/tasks/manage 페이지:
- 아이별로 구분해서 보여줘
- 각 아이 안에서 "반복 할일 🔁" / "1회성 할일 📌" 분류
- 종료된 할일은 접어서 별도 표시 + "영구 삭제" 버튼

할일 추가 폼:
- 제목, 포인트(pt 접미사 표시), 담당 아이 선택
- 반복: 요일 선택 (전체선택/해제 버튼) + 시작일
- 1회성: 마감일 선택
- recurrence는 JSONB로 저장: {kind:'weekly', days:[1,3,5]} 또는 {kind:'once', due_date:'2026-04-20'}

/tasks/history 페이지:
- 날짜별 할일 기록
- 부모는 오늘 포함 모든 날짜 수정 가능 (체크/해제)
- 아이는 읽기전용 (칩 스타일: 완료/미완료/조르기 성공/실패)
- 상단 가이드: "잘못 체크한 할일을 여기서 수정할 수 있어요"

할일 체크 컴포넌트 (TaskCheckbox):
- readOnly일 때: 칩 스타일 라벨 (초록=완료, 회색=미완료, 보라=조르기 등)
- 편집 가능할 때: 체크박스 + 취소선

모든 읽기전용 화면(홈, 가족 상세, 기록)은 TaskCheckbox readOnly를 공통 사용!
```

---

## 프롬프트 #5 — 아이 화면 + 포인트 + 캐릭터

```
5단계: 아이 화면과 포인트/캐릭터 시스템을 만들어줘.

아이 홈 (/):
- 오늘 할일 목록 + 체크
- 달성한 배지 표시 (큰 아이콘)
- 캐릭터 레벨 + 스테이지 프로그레스

부모 홈 (/):
- 아이별 오늘 할일 진행률 바
- 각 할일의 상태를 칩 스타일로 표시

포인트 (/points):
- 부모: 아이별로 분리된 최근 내역
- 아이: 본인 내역만

캐릭터 (/characters):
- 레벨 기준표 보기 (토글)
- 배지 도감: 달성=활성, 미달성=회색+달성 조건 표시
- 캐릭터 스테이지 프로그레스 바:
  🐣 병아리(L1~6) → 🧒 루키(L7~12) → ⚔️ 용사(L13~18) → 🦸 영웅(L19~24) → 👑 전설(L25~30)
- 부모도 캐릭터 페이지 접근 가능

보상 (/rewards):
- 보상 목록 + 교환 신청 (잔액 확인)
- 부모: 보상 추가/수정 + 승인/거절

레벨 계산: src/lib/level.ts — DB의 calculate_level() 함수와 반드시 동일하게!
```

---

## 프롬프트 #6 — 조르기(Beg) 기능

```
6단계: 조르기 기능을 만들어줘.

아이가 "내가 한 일"을 입력해서 추가 포인트를 요청하는 기능이야.

아이 화면 (/tasks):
- 하단에 "오늘 내가 한 일 추가" 입력폼
- 제출하면 status='requested', points=0으로 task_instances에 INSERT
- 대기 중인 요청 목록 + 취소 버튼

부모 화면 (/tasks):
- 상단에 "조르기 요청" 카드
- 포인트 입력 + 승인/거절 버튼
- 승인하면: status='completed', points 업데이트 + point_transactions INSERT + 배지 평가

상태: requested → completed(승인) 또는 deleted(거절/취소)

RLS:
- 아이는 본인 가족에 requested INSERT 가능
- 아이는 본인이 요청한 것만 DELETE 가능 (취소)
- 부모만 승인/거절 가능

조르기 건은 모든 화면에서 "🎉 조르기 성공!" / "❌ 조르기 실패" 칩으로 구분 표시.
배지 평가에서 조르기(template_id IS NULL)는 제외해.
```

---

## 프롬프트 #7 — 푸시 알림 + PWA

```
7단계: 푸시 알림과 PWA를 만들어줘.

PWA:
- manifest.json (앱이름, 아이콘, standalone 모드)
- Service Worker (sw.js) — 푸시 수신 + 클릭시 앱 열기
- 정사각형 아이콘 192x192, 512x512 필요

푸시 구독:
- 로그인 후 자동으로 알림 권한 요청
- 구독 정보를 push_subscriptions 테이블에 저장
- applicationServerKey는 반드시 urlBase64ToUint8Array()로 변환!

푸시 발송 (src/lib/push/send.ts):
- admin 클라이언트로 구독 조회
- web-push 라이브러리로 발송
- VAPID 설정은 lazy 초기화 (빌드 시 실행 방지)

중요:
- 모든 API에서 push 호출시 반드시 await 사용! (안 하면 Vercel이 잘라버림)
- catch로 에러를 삼키지 말고 console.error로 로그 남기기

푸시 시나리오:
- 조르기 요청/취소 → pushToParents()
- 조르기 승인/거절 → pushToChild()
- 보상 승인/거절 → pushToChild()
- 저녁 9시 리마인더 → 미완료 할일 있는 아이에게 (아이당 1건으로 합쳐서)
```

---

## 프롬프트 #8 — Cron + 자동화

```
8단계: Cron Job을 만들어줘.

vercel.json에 cron 2개 등록:

1. /api/cron/evening-reminder
   - 매일 12:00 UTC (= KST 21:00)
   - 미완료 할일 있는 아이에게 푸시
   - CRON_SECRET으로 인증

2. /api/cron/midnight-rollover
   - 매일 16:00 UTC (= KST 01:00)
   - 가족별 타임존 기준으로:
     (a) 어제 미완료(pending) → overdue + -50pt 벌점
     (b) 오늘 할일 인스턴스 자동 생성
   - SQL 함수로 한번에 처리 (for 루프 대신 set-based 쿼리)
   - CRON_SECRET으로 인증

ensure_today_instances는 사용자 접속 시에도 호출 (RPC).
Cron에서도 호출하여 아무도 접속 안 해도 할일이 생성되게.
```

---

## 프롬프트 #9 — 다국어 + 마무리

```
9단계: 다국어와 마무리 작업을 해줘.

i18n 구조:
- src/lib/i18n/ko.json, ja.json, en.json (280개+ 키)
- t(key, locale?) 헬퍼 함수
- useT() 훅 (클라이언트 컴포넌트용)
- 가족의 locale은 DB에서 읽어서 LocaleProvider로 전달
- 소스 코드에 한국어/일본어 하드코딩 0건이 목표

로그인 전 화면:
- 언어 선택 드롭다운 (🇰🇷 한국어 / 🇯🇵 日本語 / 🇺🇸 English)
- 선택한 언어를 쿠키에 저장 → 가족 생성시 기본값으로 사용

설정 페이지:
- 가족이름 변경 (unique 체크)
- 타임존 변경 (24개 대표 도시)
- 언어 변경
- 비밀번호 변경 (현재 비밀번호 확인 → 새 비밀번호 2번 입력)

가족 → 멤버 프로필 (/family/member/[id]):
- 캐릭터 + 레벨 + 스테이지 프로그레스
- 오늘의 할일 (칩 스타일)
- 달성 배지
- 최근 포인트 내역 20건
```

---

## 프롬프트 #10 — 배포

```
10단계: Vercel에 배포해줘.

순서:
1. vercel link (프로젝트 연결)
2. vercel env add 로 환경변수 7개 설정 (production)
3. Supabase Dashboard → Auth → URL Configuration에서:
   - Site URL: https://<프로젝트>.vercel.app
   - Redirect URLs: 위 URL + /** , http://localhost:3000
4. vercel --prod (배포!)

배포 후 확인:
- 로그인 페이지 뜨는지
- 가입 → 이메일 인증 → 가족 만들기 → 캐릭터 선택 작동하는지
- 할일 추가/체크 → 포인트 적립되는지
- 조르기 → 푸시 알림 오는지

서울 리전으로 변경하면 더 빠름:
vercel.json에 "regions": ["icn1"] 추가

끝! 🎉
```

---

## 에러가 났을 때

```
이런 에러가 났어:

[에러 메시지를 여기에 붙여넣기]

고쳐줘!
```

## AI가 이상한 코드를 줬을 때

```
방금 만든 코드에서 [문제 설명].
다시 확인하고 고쳐줘.
```
