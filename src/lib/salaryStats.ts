// ?url 로 불러오면 번들러가 내용 해시가 붙은 파일명으로 내보낸다.
// public/ 에 두면 경로가 고정이라, 데이터를 갱신해도 브라우저가 옛 파일을 계속 쓴다.
import datasetUrl from '../data/salary-stats.json?url';
import type { ResolvedCell, SalaryCell, SalaryDataset, Selection } from '../types/salary';

const cellKey = (age: string, gender: string, occupation: string) => `${age}|${gender}|${occupation}`;

/** JSON 하나만 읽는다. 외부 API를 부르지 않으므로 CORS·API 키 문제가 없다. */
export async function loadSalaryStats(signal?: AbortSignal): Promise<SalaryDataset> {
  const response = await fetch(datasetUrl, { signal });
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
 * 분위수 곡선을 막대그래프용 구간으로 바꾼다.
 *
 * 분위수 간격을 그대로 막대로 쓰면 안 된다. 실제 응답은 300만원 같은
 * 반올림 값에 몰려서, 어떤 구간은 금액 폭이 몇 만원밖에 안 된다.
 * 그 구간의 밀도가 치솟아 막대 하나만 남고 나머지가 납작해진다.
 *
 * 그래서 금액을 등간격으로 자르고, 각 구간에 몇 %가 들어가는지를 센다.
 * 폭이 같으므로 막대 높이는 그대로 비율이 된다.
 */
export function toHistogram(cell: SalaryCell, points: number[], binCount = 24): HistogramBin[] {
  const q = cell.percentiles;
  if (q.length < 2) return [];

  const lo = q[0];
  const hi = q[q.length - 1];
  const width = (hi - lo) / binCount;
  if (width <= 0) return [];

  const bins: HistogramBin[] = [];
  let fromPercentile = percentileOfWage(cell, points, lo).percentile;

  for (let i = 0; i < binCount; i += 1) {
    const from = lo + width * i;
    const to = from + width;
    const toPercentile = percentileOfWage(cell, points, to).percentile;
    const share = Math.max(0, toPercentile - fromPercentile);
    bins.push({ from, to, share, density: share / width, fromPercentile, toPercentile });
    fromPercentile = toPercentile;
  }
  return bins;
}

export interface AgeTrendPoint {
  ageId: string;
  label: string;
  /** 표본이 기준치보다 적으면 null. 선을 끊어 없는 값을 지어내지 않는다. */
  median: number | null;
  p25: number | null;
  p75: number | null;
  n: number;
}

export interface AgeTrendSeries {
  genderId: string;
  label: string;
  points: AgeTrendPoint[];
}

export interface AgeTrend {
  series: AgeTrendSeries[];
  /** 한 선만 그릴 때만 25~75% 띠를 함께 그린다. 두 선이면 겹쳐서 읽기 어렵다. */
  showBand: boolean;
  /** 표본이 모자라 비워둔 점의 수. */
  hiddenCount: number;
  /** 그릴 점이 너무 적으면 그래프를 내보내지 않는다. */
  drawable: boolean;
}

/**
 * 나이대별 중위 월급 추이.
 * 성별이 '전체'면 남녀 두 선을 그려 대비를 보여준다.
 *
 * 한 시점의 단면이지 같은 사람을 따라간 값이 아니다.
 */
export function buildAgeTrend(dataset: SalaryDataset, selection: Selection): AgeTrend {
  const points = dataset.meta.percentilePoints;
  const at = (cell: SalaryCell, p: number) => cell.percentiles[points.indexOf(p)] ?? null;

  const genderIds = selection.gender === 'all' ? ['male', 'female'] : [selection.gender];
  const ageBands = dataset.dimensions.age.filter((a) => a.id !== 'all');

  let hiddenCount = 0;
  let valid = 0;

  const series = genderIds.map((genderId) => ({
    genderId,
    label: dataset.dimensions.gender.find((g) => g.id === genderId)?.label ?? genderId,
    points: ageBands.map((band) => {
      const cell = dataset.cells[cellKey(band.id, genderId, selection.occupation)];
      // 넓히지 않는다. 다른 기준의 값을 한 선에 섞으면 추이가 아니게 된다.
      if (!cell || cell.n < dataset.meta.minSampleSize) {
        hiddenCount += 1;
        return { ageId: band.id, label: band.label, median: null, p25: null, p75: null, n: cell?.n ?? 0 };
      }
      valid += 1;
      return {
        ageId: band.id,
        label: band.label,
        median: cell.median,
        p25: at(cell, 25),
        p75: at(cell, 75),
        n: cell.n,
      };
    }),
  }));

  return { series, showBand: genderIds.length === 1, hiddenCount, drawable: valid >= 3 };
}

/** 값이 비어 있는 자리에서 끊어, 이어진 구간들로 나눈다. */
export function splitRuns<T>(items: T[], hasValue: (item: T) => boolean): T[][] {
  const runs: T[][] = [];
  let current: T[] = [];
  for (const item of items) {
    if (hasValue(item)) current.push(item);
    else if (current.length > 0) { runs.push(current); current = []; }
  }
  if (current.length > 0) runs.push(current);
  return runs;
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
