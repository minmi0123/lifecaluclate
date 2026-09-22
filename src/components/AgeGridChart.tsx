import React, { useEffect, useState } from 'react';
import { formatManwon, splitRuns } from '../lib/salaryStats';
import type { BreakdownCell, Grid } from '../types/salary';

const VIEW_W = 360;
// 선이 다섯 줄이라 나이대 추이 그래프보다 세로를 넉넉히 준다.
const VIEW_H = 216;
// 오른쪽은 강조한 줄의 이름을 적을 자리로 비워 둔다.
const PLOT = { left: 40, right: 306, top: 14, bottom: 168 };

/**
 * 나이대는 순서가 있는 값이라 색도 순서를 따라야 한다.
 * 그래서 서로 다른 색을 섞지 않고 파랑 한 가지의 명도 단계만 쓴다
 * (20대가 가장 옅고 60대 이상이 가장 진하다).
 * 가장 옅은 단계는 배경과 2:1 이상 차이 나는 250단계까지만 내려간다.
 *
 * 다만 다섯 줄을 좁은 화면에 한꺼번에 띄우면 어떤 명도 단계를 써도
 * 가운데 세 줄이 서로 구별되지 않는다. 그래서 나이대를 고른 상태에서는
 * 이 램프를 쓰지 않고, 고른 줄만 색을 주고 나머지는 회색 한 가지로 눕힌다.
 * 구별해야 할 색이 하나뿐이면 헷갈릴 일이 없다.
 * 램프는 '전체'를 골라 다섯 줄을 나란히 비교할 때만 쓴다.
 */
const SERIES_COLORS = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b'];

/** 강조하지 않는 줄. 배경과 구별되되 앞으로 나오지 않을 만큼만 진하다. */
const CONTEXT_COLOR = '#b9bfc7';

/**
 * 한 줄만 색이 있을 때 쓰는 파랑.
 *
 * 램프에서 그 나이대의 단계를 그대로 쓰면 20대는 가장 옅은 단계라
 * 강조인데도 회색 줄들 사이에서 묻힌다. 한 줄뿐일 때는 색으로 순서를
 * 나타낼 일이 없으므로, 나이대와 무관하게 회색과 확실히 갈리는
 * 한 가지 파랑을 쓴다.
 */
const HIGHLIGHT_COLOR = '#2a78d6';

interface Props {
  grid: Grid;
  /** 내 월급(원). 0이면 기준선을 긋지 않는다. */
  wage: number;
  /** 내가 고른 나이대. 'all' 이면 모든 선을 같은 굵기로 그린다. */
  myAgeId: string;
  /** 나이대를 고르지 않았을 때(= 다섯 줄을 나란히 볼 때) 아래에 적을 말. */
  hint: string;
  /** 나이대를 골랐을 때 아래에 적을 말. */
  focusedHint: string;
}

interface Point {
  i: number;
  cell: BreakdownCell;
}

const AgeGridChart: React.FC<Props> = ({ grid, wage, myAgeId, hint, focusedHint }) => {
  // 판정 영역은 가로 한 칸에 하나. 나이대별로 두면 같은 자리에 겹친다.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 범례를 눌러 다른 나이대를 잠깐 들춰 볼 수 있다.
  // 위쪽 나이대 선택과 따로 두는 이유: 그쪽을 건드리면 "내 순위" 까지 바뀐다.
  // 여기서 바꾸는 것은 어느 줄에 색을 줄지뿐이다.
  const [picked, setPicked] = useState<string | null>(null);

  // 위에서 나이대를 바꾸면 들춰 보던 것은 풀고 그쪽을 따라간다.
  useEffect(() => setPicked(null), [myAgeId]);

  const activeAgeId = picked ?? myAgeId;

  const values: number[] = [];
  for (const row of grid.values) {
    for (const cell of row) if (cell) values.push(cell.median);
  }
  if (values.length === 0) return null;
  if (wage > 0) values.push(wage);

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.1;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;

  const columnCount = grid.cols.length;
  const xAt = (i: number) =>
    PLOT.left + (columnCount === 1 ? 0 : (i / (columnCount - 1)) * (PLOT.right - PLOT.left));
  const yAt = (v: number) =>
    PLOT.bottom - ((v - yMin) / (yMax - yMin || 1)) * (PLOT.bottom - PLOT.top);

  const linePath = (pts: Point[]) =>
    pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${xAt(p.i)},${yAt(p.cell.median)}`).join(' ');

  const columnWidth = (PLOT.right - PLOT.left) / (columnCount - 1 || 1);
  const focused = activeAgeId !== 'all' && grid.rows.some((r) => r.id === activeAgeId);

  return (
    <>
      <svg
        className="ss-chart"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={grid.label}
      >
        <line className="ss-axis-line" x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} />

        {/* 내 월급 기준선. 어느 규모대에 걸치는지 한눈에 본다. */}
        {wage > 0 && (
          <g>
            <line className="ss-size-mywage" x1={PLOT.left} y1={yAt(wage)} x2={PLOT.right} y2={yAt(wage)} />
            <text className="ss-size-mywage-label" x={PLOT.left + 2} y={yAt(wage) - 5} textAnchor="start">
              내 월급
            </text>
          </g>
        )}

        {grid.rows.map((row, ri) => {
          // 고른 나이대가 있으면 그 줄만 색을 주고 나머지는 회색으로 눕힌다.
          // 고르지 않았으면(전체) 다섯 줄을 순서대로 비교하는 화면이라 램프를 쓴다.
          const dimmed = focused && row.id !== activeAgeId;
          const color = dimmed
            ? CONTEXT_COLOR
            : focused
              ? HIGHLIGHT_COLOR
              : SERIES_COLORS[ri % SERIES_COLORS.length];
          // 표본이 모자라 빈 칸이 있으면 선을 잇지 않고 끊는다.
          // 빈 칸을 미리 걸러내면 끊긴 자리가 사라지므로 null 을 넣은 채로 넘긴다.
          const slots = grid.values[ri].map((cell, i) => ({ i, cell }));
          const runs = splitRuns(slots, (p) => p.cell != null) as Point[][];
          const indexed = slots.filter((p): p is Point => p.cell != null);

          return (
            <g
              key={row.id}
              className={dimmed ? 'ss-size-series-dim' : focused ? 'ss-size-series-focus' : undefined}
            >
              {runs.map((run) => (
                <path
                  key={`line-${row.id}-${run[0].i}`}
                  className="ss-trend-line"
                  d={linePath(run)}
                  stroke={color}
                />
              ))}
              {indexed.map((p) => (
                <circle
                  key={`dot-${row.id}-${p.i}`}
                  className="ss-trend-dot"
                  cx={xAt(p.i)}
                  cy={yAt(p.cell.median)}
                  r={dimmed ? 3 : 4}
                  fill={color}
                />
              ))}

              {/* 강조한 줄에만 이름을 붙인다. 색만으로 찾게 두지 않는다. */}
              {focused && !dimmed && indexed.length > 0 && (
                <text
                  className="ss-size-series-label"
                  x={xAt(indexed[indexed.length - 1].i) + 7}
                  y={yAt(indexed[indexed.length - 1].cell.median) + 4}
                  fill={color}
                >
                  {row.label}
                </text>
              )}
            </g>
          );
        })}

        <text className="ss-axis-label" x={PLOT.left - 6} y={PLOT.top + 4} textAnchor="end">
          {formatManwon(yMax)}
        </text>
        <text className="ss-axis-label" x={PLOT.left - 6} y={PLOT.bottom} textAnchor="end">
          {formatManwon(yMin)}
        </text>

        {grid.cols.map((col, i) => (
          <text
            key={col.id}
            className="ss-axis-label"
            x={xAt(i)}
            y={PLOT.bottom + 16}
            textAnchor="middle"
          >
            {col.label}
          </text>
        ))}

        {hoveredIndex != null && (
          <line
            className="ss-trend-crosshair"
            x1={xAt(hoveredIndex)}
            y1={PLOT.top}
            x2={xAt(hoveredIndex)}
            y2={PLOT.bottom}
          />
        )}

        {grid.cols.map((col, i) => (
          <rect
            key={`hit-${col.id}`}
            className="ss-bar-hit"
            x={xAt(i) - columnWidth / 2}
            y={PLOT.top}
            width={columnWidth}
            height={PLOT.bottom - PLOT.top}
            tabIndex={0}
            role="button"
            aria-label={`${col.label} · ${grid.rows
              .map((row, ri) => {
                const cell = grid.values[ri][i];
                return cell ? `${row.label} 중위 ${formatManwon(cell.median)}` : `${row.label} 표본 부족`;
              })
              .join(', ')}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(i)}
            onBlur={() => setHoveredIndex(null)}
          />
        ))}
      </svg>

      <ul className="ss-size-legend">
        {grid.rows.map((row, ri) => {
          const isDim = focused && row.id !== activeAgeId;
          return (
            <li key={row.id}>
              {/* 누르면 그 줄에 색이 간다. 이미 색이 가 있으면 눌러서 전부 되돌린다. */}
              <button
                type="button"
                className={`ss-size-legend-button${isDim ? ' ss-size-legend-dim' : ''}`}
                aria-pressed={focused && row.id === activeAgeId}
                onClick={() => setPicked(row.id === activeAgeId ? 'all' : row.id)}
              >
                <span
                  className="ss-size-swatch"
                  style={{
                    backgroundColor: isDim
                      ? CONTEXT_COLOR
                      : focused
                        ? HIGHLIGHT_COLOR
                        : SERIES_COLORS[ri % SERIES_COLORS.length],
                  }}
                />
                {row.label}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="ss-readout">
        {hoveredIndex == null
          ? focused
            ? focusedHint
            : `${hint} · 범례를 누르면 그 나이대만 볼 수 있어요`
          : `${grid.cols[hoveredIndex].label} · ` +
            grid.rows
              .map((row, ri) => {
                const cell = grid.values[ri][hoveredIndex];
                return cell ? `${row.label} ${formatManwon(cell.median)}` : `${row.label} 표본 부족`;
              })
              .join(' · ')}
      </p>
    </>
  );
};

export default AgeGridChart;
