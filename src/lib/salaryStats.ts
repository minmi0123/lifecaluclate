import type { ResolvedCell, SalaryCell, SalaryDataset, Selection } from '../types/salary';

const cellKey = (age: string, gender: string, occupation: string) => `${age}|${gender}|${occupation}`;

/** JSON 하나만 읽는다. 외부 API를 부르지 않으므로 CORS·API 키 문제가 없다. */
export async function loadSalaryStats(signal?: AbortSignal): Promise<SalaryDataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/salary-stats.json`, { signal });
  if (!response.ok) {
    throw new Error(`월급 통계 데이터를 불러오지 못했습니다 (HTTP ${response.status})`);
  }
  return (await response.json()) as SalaryDataset;
}

/**
 * 표본이 부족할 때 넓혀 볼 순서. 성별 → 직종 → 나이대 순으로 하나씩 푼다.
 * (30대+여성+IT 에서 표본이 모자라면 30대+IT 로 넓힌다)
 */
function fallbackChain({ age, gender, occupation }: Selection): Selection[] {
  const chain: Selection[] = [{ age, gender, occupation }];
  if (gender !== 'all') chain.push({ age, gender: 'all', occupation });
  if (occupation !== 'all') chain.push({ age, gender: 'all', occupation: 'all' });
  if (age !== 'all') chain.push({ age: 'all', gender: 'all', occupation: 'all' });
  return chain;
}

/** 고른 조합의 표본이 충분하면 그대로, 아니면 한 단계씩 넓혀서 돌려준다. */
export function resolveCell(dataset: SalaryDataset, selection: Selection): ResolvedCell | null {
  const chain = fallbackChain(selection);

  for (let i = 0; i < chain.length; i += 1) {
    const used = chain[i];
    const cell = dataset.cells[cellKey(used.age, used.gender, used.occupation)];
    if (cell && cell.n >= dataset.meta.minSampleSize) {
      return { cell, used, widened: i > 0 };
    }
  }

  // 전부 기준치 미달이면 그래도 가장 넓은 칸이라도 보여준다.
  const widest = chain[chain.length - 1];
  const cell = dataset.cells[cellKey(widest.age, widest.gender, widest.occupation)];
  return cell ? { cell, used: widest, widened: chain.length > 1 } : null;
}

export interface PercentileResult {
  /** 하위 몇 %인지 (0~100). '상위'는 100에서 뺀 값. */
  percentile: number;
  /** 분포 바깥이면 어느 쪽인지. 이 경우 percentile 은 끝값으로 잘린 값이다. */
  beyond: 'low' | 'high' | null;
}

/** 월급이 분포에서 어디쯤인지 — 저장된 분위수 사이를 선형보간해 찾는다. */
export function percentileOfWage(cell: SalaryCell, points: number[], wage: number): PercentileResult {
  const q = cell.percentiles;
  if (q.length === 0) return { percentile: 50, beyond: null };
  if (wage <= q[0]) return { percentile: points[0], beyond: 'low' };
  if (wage >= q[q.length - 1]) return { percentile: points[points.length - 1], beyond: 'high' };

  for (let i = 1; i < q.length; i += 1) {
    if (wage <= q[i]) {
      const span = q[i] - q[i - 1];
      const ratio = span === 0 ? 0 : (wage - q[i - 1]) / span;
      return { percentile: points[i - 1] + (points[i] - points[i - 1]) * ratio, beyond: null };
    }
  }
  return { percentile: points[points.length - 1], beyond: 'high' };
}

export interface HistogramBin {
  from: number;
  to: number;
  /** 이 구간에 속한 비율(%). */
  share: number;
  /** 구간 폭으로 나눈 밀도 — 막대 높이의 근거. */
  density: number;
  fromPercentile: number;
  toPercentile: number;
}

/**
 * 분위수 배열을 막대그래프용 구간으로 바꾼다.
 * 이웃한 분위수 사이의 비율을 금액 폭으로 나누면 그 구간의 밀도가 된다.
 */
export function toHistogram(cell: SalaryCell, points: number[]): HistogramBin[] {
  const bins: HistogramBin[] = [];
  for (let i = 1; i < cell.percentiles.length; i += 1) {
    const from = cell.percentiles[i - 1];
    const to = cell.percentiles[i];
    const share = points[i] - points[i - 1];
    const width = to - from;
    bins.push({
      from,
      to,
      share,
      density: width > 0 ? share / width : 0,
      fromPercentile: points[i - 1],
      toPercentile: points[i],
    });
  }
  return bins;
}

/** 원 단위를 "320만원" 처럼 읽기 좋게. */
export function formatManwon(won: number): string {
  const manwon = Math.round(won / 10000);
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rest = manwon % 10000;
    return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString()}만원`;
  }
  return `${manwon.toLocaleString()}만원`;
}
