#!/usr/bin/env node
/**
 * 샘플(가짜) 월급 분포 데이터를 만든다.
 *
 * ⚠️ 여기서 나오는 숫자는 실제 통계가 아니라 화면·계산 로직을 확인하려고
 *    지어낸 값이다. meta.isSample = true 로 표시되고, 화면은 이 값을 보면
 *    "샘플 데이터" 경고 배너를 지운 채로는 결과를 보여주지 않는다.
 *
 * 실제 데이터로 바꾸려면 scripts/README.md 를 따라
 * build-salary-stats.mjs 로 같은 경로에 다시 만들면 된다.
 *
 * 실행: node scripts/make-sample-data.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERCENTILE_POINTS, normInv } from './lib/stats.mjs';
import { AGE_BANDS, GENDERS, OCCUPATIONS, cellKey } from './lib/dimensions.mjs';

const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/salary-stats.json');

// 전체 중위 월급(원). 여기에 아래 배수들을 곱해 조합별 중위값을 만든다.
const BASE_MEDIAN = 3_200_000;

const AGE_FACTOR = { all: 1.0, '20s': 0.72, '30s': 1.02, '40s': 1.18, '50s': 1.12, '60plus': 0.78 };
const GENDER_FACTOR = { all: 1.0, male: 1.12, female: 0.82 };
const OCCUPATION_FACTOR = {
  all: 1.0, management: 1.75, it: 1.35, engineering: 1.25, health: 1.05,
  education: 1.1, office: 1.05, sales: 0.92, service: 0.72, production: 0.95,
};

// 로그정규분포의 흩어진 정도. 클수록 같은 칸 안에서도 격차가 크다.
const BASE_SIGMA = 0.42;
const SIGMA_ADJUST = { management: 0.13, it: 0.06, service: -0.04, office: -0.05 };

// '전체'로 묶인 축은 여러 집단이 섞이므로 분포가 더 넓어진다.
const SIGMA_PER_ALL_AXIS = 0.05;

// 전체 표본 수. 아래 구성비를 곱해 조합별 표본 수를 만든다.
const BASE_SAMPLE = 26_000;
// 표본 1명이 대표하는 인원 수(가중값 흉내).
const WEIGHT_PER_SAMPLE = 260;

// 조합별 인원은 고르지 않다. 실제 원자료처럼 얇은 칸이 생기도록 구성비를 준다.
const AGE_SHARE = { all: 1, '20s': 0.18, '30s': 0.24, '40s': 0.25, '50s': 0.22, '60plus': 0.11 };
const GENDER_SHARE = { all: 1, male: 0.55, female: 0.45 };
const OCCUPATION_SHARE = {
  all: 1, management: 0.02, it: 0.05, engineering: 0.07, health: 0.09, education: 0.05,
  office: 0.22, sales: 0.13, service: 0.17, production: 0.2,
};

// 특정 조합은 유난히 드물거나 흔하다(예: 60대 IT 개발자는 드물다).
const OCCUPATION_BY_AGE = { it: { '20s': 1.4, '60plus': 0.15 }, management: { '20s': 0.05, '30s': 0.4 } };
const OCCUPATION_BY_GENDER = {
  it: { female: 0.35 }, management: { female: 0.3 }, engineering: { female: 0.3 },
  production: { female: 0.25 }, health: { female: 2.0 }, education: { female: 1.6 },
  service: { female: 1.5 },
};

/** 결정적 난수 — 실행할 때마다 같은 샘플이 나오도록 고정 시드를 쓴다. */
function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const rng = makeRng(20260917);

function sampleSizeFor(age, gender, occupation) {
  const interaction =
    (OCCUPATION_BY_AGE[occupation]?.[age] ?? 1) * (OCCUPATION_BY_GENDER[occupation]?.[gender] ?? 1);
  const n =
    BASE_SAMPLE * AGE_SHARE[age] * GENDER_SHARE[gender] * OCCUPATION_SHARE[occupation] * interaction;
  // 같은 구성비라도 조합마다 들쭉날쭉하므로 0.7~1.3배로 흔든다.
  return Math.max(1, Math.round(n * (0.7 + rng() * 0.6)));
}

function sigmaFor(age, gender, occupation) {
  const allAxes = [age, gender, occupation].filter((v) => v === 'all').length;
  return BASE_SIGMA + (SIGMA_ADJUST[occupation] ?? 0) + allAxes * SIGMA_PER_ALL_AXIS;
}

const cells = {};

for (const age of AGE_BANDS) {
  for (const gender of GENDERS) {
    for (const occupation of OCCUPATIONS) {
      const median =
        BASE_MEDIAN * AGE_FACTOR[age.id] * GENDER_FACTOR[gender.id] * OCCUPATION_FACTOR[occupation.id];
      const sigma = sigmaFor(age.id, gender.id, occupation.id);

      // 로그정규분포의 분위수: q(p) = median * exp(sigma * z(p))
      const percentiles = PERCENTILE_POINTS.map((p) =>
        Math.round((median * Math.exp(sigma * normInv(p / 100))) / 1000) * 1000,
      );

      const n = sampleSizeFor(age.id, gender.id, occupation.id);
      cells[cellKey(age.id, gender.id, occupation.id)] = {
        n,
        weightedN: n * WEIGHT_PER_SAMPLE,
        median: percentiles[PERCENTILE_POINTS.indexOf(50)],
        // 로그정규분포의 평균 = median * exp(sigma^2 / 2). 중위값보다 늘 높다.
        mean: Math.round((median * Math.exp((sigma * sigma) / 2)) / 1000) * 1000,
        percentiles,
      };
    }
  }
}

const payload = {
  meta: {
    isSample: true,
    sampleNotice: '이 숫자는 실제 통계가 아닙니다. 화면과 계산을 확인하려고 만든 가짜 데이터입니다.',
    surveyName: '샘플 데이터 (실제 조사 아님)',
    surveyPeriod: '',
    // 실제 데이터로 바꿀 때는 그 조사의 임금 정의(세전/세후, 포함 항목)를 그대로 적는다.
    wageDefinition: '세전 월 임금 (샘플 기준)',
    sourceUrl: 'https://mdis.mods.go.kr/',
    generatedAt: new Date().toISOString().slice(0, 10),
    minSampleSize: 30,
    percentilePoints: PERCENTILE_POINTS,
  },
  dimensions: { age: AGE_BANDS, gender: GENDERS, occupation: OCCUPATIONS },
  cells,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const belowMin = Object.values(cells).filter((c) => c.n < payload.meta.minSampleSize).length;
console.log(`샘플 데이터 생성: ${OUT_PATH}`);
console.log(`  조합 ${Object.keys(cells).length}개, 표본 부족(${payload.meta.minSampleSize}명 미만) ${belowMin}개`);
