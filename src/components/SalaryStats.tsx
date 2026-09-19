import React, { useEffect, useMemo, useState } from 'react';
import './SalaryStats.css';
import {
  formatManwon,
  loadSalaryStats,
  percentileOfWage,
  resolveCell,
  toHistogram,
} from '../lib/salaryStats';
import { toWon } from '../lib/salaryInput';
import type { SalaryDataset, Selection } from '../types/salary';

// 그래프 좌표계. CSS로 가로만 늘리고 비율은 이 viewBox가 고정한다.
const VIEW_W = 360;
const VIEW_H = 148;
const PLOT = { left: 10, right: 350, top: 30, bottom: 126 };
const PLOT_H = PLOT.bottom - PLOT.top;

/** 위를 둥글게 깎고 바닥은 축에 붙인 막대. */
function barPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} ` +
    `L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

const SalaryStats: React.FC<{
  salary: string;
  onSalaryChange: (next: string) => void;
}> = ({ salary, onSalaryChange }) => {
  const [dataset, setDataset] = useState<SalaryDataset | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selection, setSelection] = useState<Selection>({ age: '30s', gender: 'all', occupation: 'all' });
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadSalaryStats(controller.signal)
      .then(setDataset)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
      });
    return () => controller.abort();
  }, []);

  const wage = toWon(salary);

  const resolved = useMemo(
    () => (dataset ? resolveCell(dataset, selection) : null),
    [dataset, selection],
  );

  const analysis = useMemo(() => {
    if (!dataset || !resolved || wage <= 0) return null;
    const points = dataset.meta.percentilePoints;
    const { percentile, beyond } = percentileOfWage(resolved.cell, points, wage);
    const bins = toHistogram(resolved.cell, points);

    // 막대가 그려지는 금액 범위. 입력한 월급이 밖으로 나가면 축을 넓힌다.
    const binMin = bins[0].from;
    const binMax = bins[bins.length - 1].to;
    const domainMin = Math.min(binMin, wage);
    const domainMax = Math.max(binMax, Math.min(wage, binMax * 2));

    return { percentile, beyond, bins, domainMin, domainMax, points };
  }, [dataset, resolved, wage]);

  const labelOf = (kind: keyof SalaryDataset['dimensions'], id: string) =>
    dataset?.dimensions[kind].find((o) => o.id === id)?.label ?? id;

  const describe = (sel: Selection) => {
    const parts = [
      sel.age === 'all' ? '전체 나이' : labelOf('age', sel.age),
      sel.gender === 'all' ? '남녀 전체' : labelOf('gender', sel.gender),
      sel.occupation === 'all' ? '전체 직종' : labelOf('occupation', sel.occupation),
    ];
    return parts.join(' · ');
  };

  const adjustSalary = (step: number) => {
    onSalaryChange(`${Math.max(0, toWon(salary) / 10000 + step)}만원`);
  };

  if (loadError) {
    return (
      <div className="ss-container">
        <div className="ss-scroll">
          <p className="ss-error">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!dataset || !resolved) {
    return (
      <div className="ss-container">
        <div className="ss-scroll">
          <p className="ss-loading">월급 통계를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  const { meta } = dataset;
  const { cell, used, widened } = resolved;

  const scaleX = (value: number) => {
    if (!analysis) return PLOT.left;
    const { domainMin, domainMax } = analysis;
    const span = domainMax - domainMin;
    if (span <= 0) return PLOT.left;
    const ratio = (value - domainMin) / span;
    return PLOT.left + ratio * (PLOT.right - PLOT.left);
  };

  const maxShare = analysis ? Math.max(...analysis.bins.map((b) => b.share)) : 0;
  const markerX = analysis ? scaleX(wage) : 0;
  const topPercent = analysis ? Math.min(99, Math.max(1, Math.round(100 - analysis.percentile))) : 0;

  // 마우스를 올린 막대가 있으면 그 설명을, 없으면 내 위치 설명을 보여준다.
  const hovered = analysis && hoveredBin !== null ? analysis.bins[hoveredBin] : null;

  return (
    <div className="ss-container">
      <div className="ss-scroll">
        {meta.isSample && (
          <div className="ss-sample-banner" role="alert">
            <strong>샘플 데이터입니다</strong>
            <span>
              {meta.sampleNotice ?? '아래 숫자는 실제 통계가 아니라 화면 확인용으로 만든 값입니다.'}
            </span>
          </div>
        )}

        <h1 className="ss-title">내 월급, 어느 정도일까?</h1>
        <p className="ss-subtitle">나이대 · 성별 · 직종 안에서 내 월급이 상위 몇 %인지 확인해요</p>

        <div className="ss-filters">
          <label className="ss-field">
            <span className="ss-field-label">나이대</span>
            <select
              className="ss-select"
              value={selection.age}
              onChange={(e) => setSelection({ ...selection, age: e.target.value })}
            >
              {dataset.dimensions.age.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="ss-field">
            <span className="ss-field-label">성별</span>
            <select
              className="ss-select"
              value={selection.gender}
              onChange={(e) => setSelection({ ...selection, gender: e.target.value })}
            >
              {dataset.dimensions.gender.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="ss-field ss-field-wide">
            <span className="ss-field-label">직종</span>
            <select
              className="ss-select"
              value={selection.occupation}
              onChange={(e) => setSelection({ ...selection, occupation: e.target.value })}
            >
              {dataset.dimensions.occupation.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="ss-salary-input">
          <span className="ss-field-label">내 월급</span>
          <div className="ss-stepper">
            <button className="ss-step-button" type="button" onClick={() => adjustSalary(-10)}>−</button>
            <input
              className="ss-input"
              type="text"
              inputMode="numeric"
              value={salary}
              aria-label="내 월급 (만원)"
              onChange={(e) => onSalaryChange(`${e.target.value.replace(/[^0-9]/g, '')}만원`)}
            />
            <button className="ss-step-button" type="button" onClick={() => adjustSalary(10)}>+</button>
          </div>
          <p className="ss-wage-definition">기준: {meta.wageDefinition}</p>
          <p className="ss-wage-shared">여기 입력한 월급을 아래 부자 · 저축 · 커피에서도 그대로 씁니다.</p>
        </div>

        {!analysis ? (
          <p className="ss-hint">월급을 입력하면 내 위치를 알려드려요.</p>
        ) : (
          <>
            <div className="ss-headline">
              <span className="ss-headline-label">{describe(used)} 중에서</span>
              <strong className="ss-headline-value">
                {analysis.beyond === 'high'
                  ? '상위 1% 안'
                  : analysis.beyond === 'low'
                    ? '하위 1%'
                    : `상위 ${topPercent}%`}
              </strong>
              <span className="ss-headline-sub">
                이 조합의 중앙값은 {formatManwon(cell.median)} ·{' '}
                {Math.round((wage - cell.median) / 10000) === 0
                  ? '중앙값과 비슷해요'
                  : wage > cell.median
                    ? `내가 ${formatManwon(wage - cell.median)} 많아요`
                    : `내가 ${formatManwon(cell.median - wage)} 적어요`}
              </span>
            </div>

            {widened && (
              <p className="ss-notice">
                고른 조합({describe(selection)})은 표본이 {meta.minSampleSize}명보다 적어서,
                <br />
                <strong>{describe(used)}</strong> 기준으로 비교했어요.
              </p>
            )}

            <figure className="ss-figure">
              <figcaption className="ss-figure-title">
                월급 분포
                <span className="ss-figure-note">표본 {cell.n.toLocaleString()}명</span>
              </figcaption>

              <svg
                className="ss-chart"
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                role="img"
                aria-label={`${describe(used)}의 월급 분포. 내 월급 ${formatManwon(wage)}은 상위 ${topPercent}%.`}
              >
                <line
                  className="ss-axis-line"
                  x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom}
                />

                {analysis.bins.map((bin, i) => {
                  const x = scaleX(bin.from);
                  const w = Math.max(1, scaleX(bin.to) - x - 2);
                  const h = maxShare > 0 ? (bin.share / maxShare) * PLOT_H : 0;
                  const y = PLOT.bottom - h;
                  const isMine = wage >= bin.from && wage < bin.to;
                  return (
                    <g key={bin.from}>
                      <path
                        className={`ss-bar ${isMine ? 'ss-bar-mine' : ''}`}
                        d={barPath(x, y, w, Math.max(h, 1), 4)}
                      />
                      {/* 막대가 얇아도 잡히도록 전체 높이의 투명한 영역을 덮는다. */}
                      <rect
                        className="ss-bar-hit"
                        x={x} y={PLOT.top} width={w + 2} height={PLOT_H}
                        onMouseEnter={() => setHoveredBin(i)}
                        onMouseLeave={() => setHoveredBin(null)}
                        onFocus={() => setHoveredBin(i)}
                        onBlur={() => setHoveredBin(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`상위 ${Math.round(100 - bin.toPercentile)}~${Math.round(100 - bin.fromPercentile)}% 구간, ${formatManwon(bin.from)}부터 ${formatManwon(bin.to)}`}
                      />
                    </g>
                  );
                })}

                <line
                  className="ss-marker"
                  x1={markerX} y1={PLOT.top - 12} x2={markerX} y2={PLOT.bottom}
                />
                <g transform={`translate(${Math.min(Math.max(markerX, PLOT.left + 18), PLOT.right - 18)}, ${PLOT.top - 18})`}>
                  <rect className="ss-marker-chip" x={-16} y={-11} width={32} height={18} rx={9} />
                  <text className="ss-marker-text" x={0} y={2}>나</text>
                </g>

                <text className="ss-axis-label" x={PLOT.left} y={PLOT.bottom + 16} textAnchor="start">
                  {formatManwon(analysis.domainMin)}
                </text>
                <text className="ss-axis-label" x={PLOT.right} y={PLOT.bottom + 16} textAnchor="end">
                  {formatManwon(analysis.domainMax)}
                </text>
              </svg>

              <p className="ss-readout">
                {hovered
                  ? `${formatManwon(hovered.from)} ~ ${formatManwon(hovered.to)} · 상위 ${Math.round(100 - hovered.toPercentile)}~${Math.round(100 - hovered.fromPercentile)}%`
                  : '막대를 짚으면 그 구간의 금액대를 볼 수 있어요'}
              </p>
            </figure>

            <details className="ss-table-toggle">
              <summary>분위수 표로 보기</summary>
              <table className="ss-table">
                <thead>
                  <tr><th>상위</th><th>월급</th></tr>
                </thead>
                <tbody>
                  {[...analysis.points].reverse().map((p, i) => {
                    const value = cell.percentiles[cell.percentiles.length - 1 - i];
                    return (
                      <tr key={p}>
                        <th scope="row">{100 - p}%</th>
                        <td>{formatManwon(value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          </>
        )}

        <div className="ss-footnotes">
          <p>입력한 월급은 브라우저 안에서만 계산해요. 서버로 보내거나 저장하지 않습니다.</p>
          <p>
            평균이 아니라 <strong>분위수</strong>로 보여줘요. 평균은 소수의 고소득자 때문에 위로 끌려가요.
          </p>
          <p>
            출처: {meta.surveyName}
            {meta.surveyPeriod ? ` (${meta.surveyPeriod})` : ''} · 갱신 {meta.generatedAt}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryStats;
