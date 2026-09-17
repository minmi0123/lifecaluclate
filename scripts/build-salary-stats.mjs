#!/usr/bin/env node
/**
 * MDIS 원자료(CSV)를 화면이 읽는 salary-stats.json 으로 변환한다.
 *
 * 실행: node scripts/build-salary-stats.mjs scripts/mdis.config.json
 *
 * 조사마다 컬럼 이름과 코드값이 다르므로 매핑은 전부 설정 파일로 뺐다.
 * 설정 작성법은 scripts/README.md 참고.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERCENTILE_POINTS, quantileCurve, weightedMean } from './lib/stats.mjs';
import { AGE_BANDS, GENDERS, OCCUPATIONS, cellKey } from './lib/dimensions.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 따옴표로 감싼 값과 그 안의 쉼표를 처리하는 최소한의 CSV 파서. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((v) => v !== '')) rows.push(row);

  const header = rows.shift().map((h) => h.trim().replace(/^﻿/, ''));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/** 응답자 한 명의 나이를 나이대 id 로 바꾼다. */
function toAgeBand(age, bands) {
  const n = Number(age);
  if (!Number.isFinite(n)) return null;
  const hit = bands.find((b) => n >= b.min && (b.max == null || n <= b.max));
  return hit ? hit.id : null;
}

function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('사용법: node scripts/build-salary-stats.mjs <설정파일.json>');
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(resolve(ROOT, configPath), 'utf8'));
  const { columns, ageBands, genderMap, occupationMap, wageMultiplier = 1, meta = {} } = config;

  const raw = readFileSync(resolve(ROOT, config.input), config.encoding ?? 'utf8');
  const records = parseCsv(raw);
  console.log(`원자료 ${records.length.toLocaleString()}행 읽음`);

  // 조합별로 응답을 모은다. 'all'은 별도 집계가 아니라 같은 응답을 한 번 더 담는 것.
  const buckets = new Map();
  const skipped = { wage: 0, age: 0, gender: 0, occupation: 0 };

  for (const rec of records) {
    const wage = Number(rec[columns.wage]) * wageMultiplier;
    if (!Number.isFinite(wage) || wage <= 0) { skipped.wage += 1; continue; }

    const weight = columns.weight ? Number(rec[columns.weight]) : 1;
    if (!Number.isFinite(weight) || weight <= 0) { skipped.wage += 1; continue; }

    const age = toAgeBand(rec[columns.age], ageBands);
    if (!age) { skipped.age += 1; continue; }

    const gender = genderMap[String(rec[columns.gender]).trim()];
    if (!gender) { skipped.gender += 1; continue; }

    // 매핑에 없는 직종 코드는 버리지 않고 '전체'에만 반영한다.
    const occupation = occupationMap[String(rec[columns.occupation]).trim()] ?? null;
    if (!occupation) skipped.occupation += 1;

    const entry = { value: wage, weight };
    for (const a of [age, 'all']) {
      for (const g of [gender, 'all']) {
        for (const o of occupation ? [occupation, 'all'] : ['all']) {
          const key = cellKey(a, g, o);
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(entry);
        }
      }
    }
  }

  const cells = {};
  for (const [key, rows] of buckets) {
    rows.sort((a, b) => a.value - b.value);
    const percentiles = quantileCurve(rows).map((v) => Math.round(v / 1000) * 1000);
    cells[key] = {
      n: rows.length,
      weightedN: Math.round(rows.reduce((sum, r) => sum + r.weight, 0)),
      median: percentiles[PERCENTILE_POINTS.indexOf(50)],
      mean: Math.round(weightedMean(rows) / 1000) * 1000,
      percentiles,
    };
  }

  const payload = {
    meta: {
      isSample: false,
      surveyName: meta.surveyName ?? '',
      surveyPeriod: meta.surveyPeriod ?? '',
      wageDefinition: meta.wageDefinition ?? '',
      sourceUrl: meta.sourceUrl ?? 'https://mdis.mods.go.kr/',
      generatedAt: new Date().toISOString().slice(0, 10),
      minSampleSize: config.minSampleSize ?? 30,
      percentilePoints: PERCENTILE_POINTS,
    },
    dimensions: { age: AGE_BANDS, gender: GENDERS, occupation: OCCUPATIONS },
    cells,
  };

  const outPath = resolve(ROOT, config.output ?? 'public/data/salary-stats.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`생성 완료: ${outPath}`);
  console.log(`  조합 ${Object.keys(cells).length}개`);
  console.log(`  제외 — 임금/가중값 이상 ${skipped.wage}, 나이 ${skipped.age}, 성별 ${skipped.gender}`);
  console.log(`  직종 코드 미매핑 ${skipped.occupation}행은 '전체'에만 반영됨`);

  const missing = [];
  for (const a of AGE_BANDS) for (const g of GENDERS) for (const o of OCCUPATIONS) {
    if (!cells[cellKey(a.id, g.id, o.id)]) missing.push(cellKey(a.id, g.id, o.id));
  }
  if (missing.length) console.log(`  응답이 하나도 없는 조합 ${missing.length}개 (화면에서는 넓은 기준으로 대체됨)`);
}

main();
