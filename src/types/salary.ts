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

export interface SalaryDataset {
  meta: SalaryMeta;
  dimensions: {
    age: DimensionOption[];
    gender: DimensionOption[];
    occupation: DimensionOption[];
  };
  cells: Record<string, SalaryCell>;
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
