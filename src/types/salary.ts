export interface DimensionOption {
  id: string;
  label: string;
}

/** 나이대 × 성별 × 직종 조합 하나의 분포. */
export interface SalaryCell {
  /** 표본 수(응답자 수). 이 값이 작으면 결과를 믿기 어렵다. */
  n: number;
  /** 가중값을 반영한 추정 모집단 크기. */
  weightedN: number;
  median: number;
  mean: number;
  /** meta.percentilePoints 와 같은 순서의 월급(원). */
  percentiles: number[];
}

export interface SalaryMeta {
  /** true면 화면에 샘플 데이터 경고를 띄운다. */
  isSample: boolean;
  sampleNotice?: string;
  surveyName: string;
  surveyPeriod: string;
  /** 세전/세후, 포함 항목. 입력창 옆에 그대로 표시된다. */
  wageDefinition: string;
  sourceUrl: string;
  generatedAt: string;
  /** 이 수보다 표본이 적으면 더 넓은 기준으로 바꿔 보여준다. */
  minSampleSize: number;
  percentilePoints: number[];
}

/** breakdowns 한 칸. 표본이 모자라면 null 이 들어온다. */
export interface BreakdownCell {
  n: number;
  weightedN: number;
  median: number;
}

/**
 * 그래프용 얕은 집계.
 *
 * `cells` 가 "내 순위"를 위해 축 세 개를 교차하는 것과 달리,
 * 여기는 축 한둘로만 쪼갠다. 그래서 축을 더해도 데이터가 선형으로만 는다.
 */
export interface Grid {
  label: string;
  rows: DimensionOption[];
  cols: DimensionOption[];
  /** 나이대를 가리지 않은 전체 줄. rows 와 같은 col 순서. */
  overall: (BreakdownCell | null)[];
  /** [rows][cols] 순서. */
  values: (BreakdownCell | null)[][];
}

export interface Breakdowns {
  ageByCompanySize: Grid;
  ageByTenure: Grid;
}

export interface SalaryDataset {
  meta: SalaryMeta;
  dimensions: {
    age: DimensionOption[];
    gender: DimensionOption[];
    occupation: DimensionOption[];
  };
  cells: Record<string, SalaryCell>;
  breakdowns: Breakdowns;
}

export interface Selection {
  age: string;
  gender: string;
  occupation: string;
}

/** 실제로 비교에 쓴 조합. 표본이 부족하면 고른 것보다 넓어질 수 있다. */
export interface ResolvedCell {
  cell: SalaryCell;
  used: Selection;
  /** 고른 조합 그대로 쓰지 못하고 넓힌 경우 true. */
  widened: boolean;
}
