# 월급 통계 데이터 만들기

화면(`src/components/SalaryStats.tsx`)은 `public/data/salary-stats.json` 하나만 `fetch` 한다.
API를 직접 부르지 않으므로 CORS·API 키 노출·http 전용 API 문제가 없다.

```
MDIS 원자료(CSV) ──[build-salary-stats.mjs]──> public/data/salary-stats.json ──> 정적 페이지
```

## 지금 들어있는 데이터

**`public/data/salary-stats.json` 은 현재 샘플(가짜) 데이터다.**
`meta.isSample` 이 `true` 이고, 화면 맨 위에 경고 배너가 항상 떠 있다.

```bash
node scripts/make-sample-data.mjs   # 샘플 다시 만들기 (고정 시드라 결과가 같음)
```

## 실제 데이터로 바꾸기

### 1. 원자료 받기

[MDIS 마이크로데이터 통합서비스](https://mdis.mods.go.kr/)에서 받는다.
추천 조사는 **경제활동인구조사 근로형태별 부가조사**(연 1회, 8월 조사).
응답자별로 나이·성별·직종·임금·가중값이 들어 있어 교차 조합을 직접 계산할 수 있다.

| 조사 | 주기 | 비고 |
|---|---|---|
| 경제활동인구조사 근로형태별 부가조사 | 연 1회(8월) | 1순위. 원자료 공개는 보통 11월경 |
| 지역별고용조사 (A·B형) | 반기 | 공개 즉시 무료 다운로드 |
| 고용형태별 근로실태조사 | 연 1회 | 직종 구분이 상세 |

원자료는 저장소에 커밋하지 않는다(`.gitignore` 의 `raw/`). 용량이 크고 배포에 필요 없다.

### 2. 설정 파일 작성

`scripts/mdis.config.example.json` 을 `scripts/mdis.config.json` 으로 복사한 뒤,
받은 파일의 코드북(레이아웃 문서)을 보고 채운다.

| 키 | 뜻 |
|---|---|
| `input` | 원자료 CSV 경로 (저장소 루트 기준) |
| `columns` | 나이·성별·직종·임금·**가중값** 컬럼 이름 |
| `wageMultiplier` | 임금 컬럼을 **원** 단위로 바꾸는 배수 (만원 단위면 `10000`) |
| `ageBands` | 나이 → 나이대 구간 |
| `genderMap` | 성별 코드 → `male` / `female` |
| `occupationMap` | 직종 코드 → `src/../dimensions.mjs` 의 직종 id |
| `meta.wageDefinition` | 그 조사의 임금 정의. **그대로 화면에 표시되므로 정확히 적을 것** |

주의할 점:

- **`columns.weight` 는 반드시 채운다.** 가중값을 빼면 표본 편향이 결과에 그대로 남는다.
- **직종(職種)을 쓰고 산업(産業)은 쓰지 않는다.** 산업은 회사가 하는 일이라
  IT 회사의 경리도 "정보통신업"으로 잡힌다. 우리가 원하는 건 본인이 하는 일이다.
- `occupationMap` 에 없는 코드의 응답은 버려지지 않고 직종 "전체"에만 반영된다.

### 3. 변환

```bash
node scripts/build-salary-stats.mjs scripts/mdis.config.json
```

조합별로 분위수(1·5·10…95·99%)·중앙값·평균·표본 수를 계산해 JSON에 저장한다.
`meta.isSample` 이 `false` 로 바뀌면서 화면의 샘플 경고 배너도 사라진다.

### 4. 확인

```bash
npm run build && npm run preview
```

- 화면 위 경고 배너가 사라졌는지
- 임금 정의 문구가 조사 내용과 맞는지
- 표본이 적은 조합에서 "넓은 기준으로 비교했다"는 안내가 뜨는지

## 갱신 주기

근로형태별 부가조사 원자료는 매년 11월경 새로 공개된다.
받아서 2~3단계를 다시 돌리고 JSON만 교체하면 된다. 코드는 건드릴 일이 없다.
일정은 [MDIS 제공 일정](https://mdis.mods.go.kr/mobile/ofrScheduleMainList.do)에서 확인한다.

## 왜 집계 API를 안 쓰나

"30대 평균", "여성 평균", "IT 평균"은 각각 따로 집계된 값이라 겹치는 인원 정보가 없다.
세 값을 곱해 추정할 수는 있지만 세 기준이 서로 독립이라는 가정(= IT 업계 내 남녀 격차가
전체 남녀 격차와 같다는 가정)이 필요하고, 실제와 다르면 오차가 크다.
원자료에는 응답자별 값이 다 있으므로 원하는 조합을 정확히 계산할 수 있다.
