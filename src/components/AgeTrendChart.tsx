import React, { useState } from 'react';
import { formatManwon, splitRuns } from '../lib/salaryStats';
import type { AgeTrend, AgeTrendPoint } from '../lib/salaryStats';

const VIEW_W = 360;
const VIEW_H = 176;
const PLOT = { left: 46, right: 348, top: 14, bottom: 130 };

// 계열 색. 고정 순서로 배정하고 돌려쓰지 않는다.
const SERIES_COLORS = ['#2a78d6', '#eb6834'];

interface Props {
  trend: AgeTrend;
  /** 내 월급(원). 0이면 위치 점을 찍지 않는다. */
  wage: number;
  /** 내가 고른 나이대. 전체면 점을 찍지 않는다. */
  myAgeId: string;
  groupLabel: string;
}

const AgeTrendChart: React.FC<Props> = ({ trend, wage, myAgeId, groupLabel }) => {
  // 나이대 하나에 판정 영역 하나. 계열마다 두면 같은 자리에 겹쳐서 아래 것을 잡을 수 없다.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const ageLabels = trend.series[0].points.map((p) => p.label);
  const columnCount = ageLabels.length;

  // 값이 있는 모든 수치에 내 월급까지 더해 세로 범위를 잡는다.
  const values: number[] = [];
  for (const s of trend.series) {
    for (const p of s.points) {
      if (p.median != null) values.push(p.median);
      if (trend.showBand && p.p25 != null) values.push(p.p25, p.p75 as number);
    }
  }
  const myIndex = trend.series[0].points.findIndex((p) => p.ageId === myAgeId);
  const showMyDot = wage > 0 && myIndex >= 0;
  if (showMyDot) values.push(wage);

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.1;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;

  const xAt = (i: number) =>
    PLOT.left + (columnCount === 1 ? 0 : (i / (columnCount - 1)) * (PLOT.right - PLOT.left));
  const yAt = (v: number) =>
    PLOT.bottom - ((v - yMin) / (yMax - yMin || 1)) * (PLOT.bottom - PLOT.top);

  const linePath = (pts: { i: number; v: number }[]) =>
    pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${xAt(p.i)},${yAt(p.v)}`).join(' ');

  const columnWidth = (PLOT.right - PLOT.left) / (columnCount - 1 || 1);

  return (
    <>
      <svg
        className="ss-chart"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`${groupLabel}의 나이대별 중위 월급 추이`}
      >
        <line className="ss-axis-line" x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} />

        {trend.series.map((series, si) => {
          const color = SERIES_COLORS[si % SERIES_COLORS.length];
          const indexed = series.points.map((p, i) => ({ ...p, i }));
          const runs = splitRuns(indexed, (p) => p.median != null);

          return (
            <g key={series.genderId}>
              {/* 25~75% 범위. 한 선일 때만 그린다. */}
              {trend.showBand &&
                runs.map((run) => {
                  const top = run.map((p) => `${xAt(p.i)},${yAt(p.p75 as number)}`);
                  const bottom = [...run].reverse().map((p) => `${xAt(p.i)},${yAt(p.p25 as number)}`);
                  return (
                    <polygon
                      key={`band-${run[0].ageId}`}
                      className="ss-trend-band"
                      points={[...top, ...bottom].join(' ')}
                      fill={color}
                    />
                  );
                })}

              {runs.map((run) => (
                <path
                  key={`line-${run[0].ageId}`}
                  className="ss-trend-line"
                  d={linePath(run.map((p) => ({ i: p.i, v: p.median as number })))}
                  stroke={color}
                />
              ))}

              {indexed
                .filter((p) => p.median != null)
                .map((p) => (
                  <circle
                    key={`dot-${p.ageId}`}
                    className="ss-trend-dot"
                    cx={xAt(p.i)}
                    cy={yAt(p.median as number)}
                    r={4}
                    fill={color}
                  />
                ))}
            </g>
          );
        })}

        {/* 내 월급 위치 */}
        {showMyDot && (
          <g>
            <circle className="ss-trend-me-ring" cx={xAt(myIndex)} cy={yAt(wage)} r={7} />
            <circle className="ss-trend-me" cx={xAt(myIndex)} cy={yAt(wage)} r={4.5} />
            {/* 위쪽에 자리가 없으면 점 아래에 붙인다. */}
            <text
              className="ss-trend-me-label"
              x={xAt(myIndex)}
              y={yAt(wage) - 13 < PLOT.top + 8 ? yAt(wage) + 20 : yAt(wage) - 13}
              textAnchor="middle"
            >
              나
            </text>
          </g>
        )}

        {/* 세로축은 위아래 값만 */}
        <text className="ss-axis-label" x={PLOT.left - 6} y={PLOT.top + 4} textAnchor="end">
          {formatManwon(yMax)}
        </text>
        <text className="ss-axis-label" x={PLOT.left - 6} y={PLOT.bottom} textAnchor="end">
          {formatManwon(yMin)}
        </text>

        {ageLabels.map((label, i) => (
          <text
            key={label}
            className="ss-axis-label"
            x={xAt(i)}
            y={PLOT.bottom + 16}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* 세로 한 줄을 통째로 판정 영역으로 삼아 그 나이대의 모든 계열을 함께 읽는다. */}
        {hoveredIndex != null && (
          <line
            className="ss-trend-crosshair"
            x1={xAt(hoveredIndex)}
            y1={PLOT.top}
            x2={xAt(hoveredIndex)}
            y2={PLOT.bottom}
          />
        )}

        {ageLabels.map((label, i) => (
          <rect
            key={`hit-${label}`}
            className="ss-bar-hit"
            x={xAt(i) - columnWidth / 2}
            y={PLOT.top}
            width={columnWidth}
            height={PLOT.bottom - PLOT.top}
            tabIndex={0}
            role="button"
            aria-label={`${label} ${trend.series
              .map((series) =>
                series.points[i].median == null
                  ? `${series.label} 표본 부족`
                  : `${series.label} 중위 ${formatManwon(series.points[i].median as number)}`,
              )
              .join(', ')}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(i)}
            onBlur={() => setHoveredIndex(null)}
          />
        ))}
      </svg>

      <p className="ss-readout">
        {hoveredIndex == null
          ? trend.showBand
            ? '옅은 띠는 그 나이대의 가운데 절반(25~75%)이 받는 범위예요'
            : '성별을 고르면 25~75% 범위도 함께 볼 수 있어요'
          : `${ageLabels[hoveredIndex]} · ` +
            trend.series
              .map((series) => {
                const point = series.points[hoveredIndex];
                if (point.median == null) return `${series.label} 표본 부족`;
                const range = trend.showBand
                  ? ` (${formatManwon(point.p25 as number)}~${formatManwon(point.p75 as number)})`
                  : '';
                return `${series.label} ${formatManwon(point.median)}${range}`;
              })
              .join(' · ')}
      </p>
    </>
  );
};

export type { AgeTrendPoint };
export default AgeTrendChart;
