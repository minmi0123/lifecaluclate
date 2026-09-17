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

`public/data/salary-stats.json` 은 화면과 계산을 확인하려고 만든 **가짜 데이터**다.
`meta.isSample` 이 `true` 인 동안 화면 맨 위에 경고 배너가 뜬다.
실제 MDIS 원자료로 바꾸는 방법은 [`scripts/README.md`](scripts/README.md)에 있다.

### 구조

```
MDIS 원자료(CSV) ──[scripts/build-salary-stats.mjs]──> public/data/salary-stats.json
                                                              │
                                              정적 페이지가 이 JSON 하나만 fetch
```

외부 API를 실행 중에 부르지 않으므로 CORS · API 키 노출 · http 전용 API 문제가 없다.
데이터 갱신은 JSON만 다시 만들면 되고 코드는 건드리지 않는다.

## 나머지 탭

| 탭 | 하는 일 |
|---|---|
| 💸 부자 | 월급으로 랜덤 목표 상품을 사는 데 몇 년 걸리는지 |
| 🕒 퇴근 | 출퇴근 시각 기준 오늘 근무 진행률 |
| 💰 저축 | 저축률과 목표 금액 도달 시점 |
| ☕ 커피 | 하루 커피값의 1년치 환산 |

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

배포는 GitHub Pages (`npm run deploy`). Vite `base` 와 라우터 경로가 `/lifecaluclate/` 로 맞춰져 있다.
