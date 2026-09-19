# lifecaluclate

직장인용 계산기 모음. 메인은 **월급 통계**다.

## 월급 통계 (메인)

나이대 × 성별 × 직종 안에서 내 월급이 **상위 몇 %**인지 보여준다.

- 평균이 아니라 **분위수**를 보여준다. 평균은 소수의 고소득자 때문에 위로 끌려간다.
- 입력한 월급은 **브라우저 안에서만** 계산한다. 서버로 보내거나 저장하지 않는다.
- 고른 조합의 표본이 기준치(기본 30명)보다 적으면 **한 단계 넓혀서** 비교하고 그 사실을 화면에 알린다.
  (30대 + 여성 + IT 에서 표본이 모자라면 30대 + IT 로)
- 회사별 연봉 추정은 **하지 않는다**.

### ⚠️ 지금 들어있는 데이터는 샘플이다

`src/data/salary-stats.json` 은 화면과 계산을 확인하려고 만든 **가짜 데이터**다.
`meta.isSample` 이 `true` 인 동안 화면 맨 위에 경고 배너가 뜬다.
실제 MDIS 원자료로 바꾸는 방법은 [`scripts/README.md`](scripts/README.md)에 있다.

### 구조

```
MDIS 원자료(CSV) ──[scripts/build-salary-stats.mjs]──> src/data/salary-stats.json
                                                              │
                                              정적 페이지가 이 JSON 하나만 fetch
```

외부 API를 실행 중에 부르지 않으므로 CORS · API 키 노출 · http 전용 API 문제가 없다.
데이터 갱신은 JSON만 다시 만들면 되고 코드는 건드리지 않는다.

## 한 페이지 구성

네 구역이 한 페이지에 순서대로 쌓여 있고, 위쪽 탭을 누르면 그 구역으로 스크롤한다.
탭바는 `position: sticky` 로 붙어 있어 내려가도 계속 누를 수 있다.
`#salary` `#rich` `#savings` `#coffee` 해시로 바로 들어갈 수도 있다.

컴포넌트마다 CSS 클래스에 접두사(`ss-` `rich-` `savings-` `coffee-`)를 붙여 둔다.
CSS 는 전역으로 합쳐지므로, 접두사가 없으면 한 페이지에 함께 그려질 때
나중에 import 된 파일이 앞의 스타일을 덮어쓴다.

## 구역별 하는 일

| 구역 | 하는 일 |
|---|---|
| 💸 부자 | 월급으로 랜덤 목표 상품을 사는 데 몇 년 걸리는지 |
| 💰 저축 | 저축률과 목표 금액 도달 시점 |
| ☕ 커피 | 하루 커피값이 내 연봉의 몇 %인지, 며칠치 일한 돈인지 |

## 개발

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173/lifecaluclate/)
npm run build        # 타입 체크 + 빌드
npm run lint
npm run preview      # 빌드 결과 확인
```

데이터:

```bash
npm run data:sample  # 샘플 데이터 다시 만들기 (고정 시드)
npm run data:build   # 실제 원자료로 만들기 (scripts/mdis.config.json 필요)
```

## 배포

`main` 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드해서
GitHub Pages 에 올린다. PR 에서는 lint + build 까지만 돌고 배포하지 않는다.

주소: https://minmi0123.github.io/lifecaluclate/

**저장소 Settings → Pages → Source 가 "GitHub Actions" 여야 한다.**
"Deploy from a branch" 로 되어 있으면 배포 단계에서 실패한다.

Vite `base` 가 `/lifecaluclate/` 로 맞춰져 있다. 라우팅은 쓰지 않고 한 페이지 +
해시라서 새로고침해도 404 가 나지 않는다.

`npm run deploy` (gh-pages 브랜치로 직접 push)도 아직 남아 있지만,
Actions 로 배포한다면 쓸 일이 없다.
