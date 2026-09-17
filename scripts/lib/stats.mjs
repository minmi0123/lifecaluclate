// 분위수 계산 공용 유틸. 샘플 생성기와 실제 원자료 변환기가 함께 사용한다.

/**
 * JSON에 저장할 분위수 지점(%).
 * 1·99를 포함해 꼬리를 잡고, 사이는 5% 간격으로 둔다.
 * 이 배열을 바꾸면 데이터 JSON과 화면 보간이 함께 따라간다.
 */
export const PERCENTILE_POINTS = [
  1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99,
];

/** 표준정규분포의 역누적분포(Acklam 근사). 샘플 데이터 생성에 쓴다. */
export function normInv(p) {
  if (p <= 0 || p >= 1) throw new RangeError(`normInv: p는 0<p<1 이어야 함 (받은 값: ${p})`);

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * 가중 분위수.
 * rows는 [{ value, weight }] — value 오름차순으로 정렬돼 있어야 한다.
 * 누적 가중치가 목표 비율을 지나는 지점을 선형보간한다.
 * 가중값을 쓰지 않으면 표본 편향이 그대로 결과에 남으므로 weight는 필수.
 */
export function weightedQuantile(rows, p) {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0].value;

  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  if (total <= 0) return null;

  const target = (p / 100) * total;
  let cumulative = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const prev = cumulative;
    cumulative += rows[i].weight;
    if (cumulative >= target) {
      // 구간 안에서의 위치를 비율로 환산해 앞뒤 값을 섞는다.
      if (i === 0) return rows[0].value;
      const span = cumulative - prev;
      const ratio = span === 0 ? 0 : (target - prev) / span;
      return rows[i - 1].value + (rows[i].value - rows[i - 1].value) * ratio;
    }
  }
  return rows[rows.length - 1].value;
}

/** 가중 평균. */
export function weightedMean(rows) {
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  if (total <= 0) return null;
  return rows.reduce((sum, r) => sum + r.value * r.weight, 0) / total;
}

/** 분위수 배열 전체를 한 번에 계산한다. */
export function quantileCurve(rows, points = PERCENTILE_POINTS) {
  return points.map((p) => weightedQuantile(rows, p));
}
