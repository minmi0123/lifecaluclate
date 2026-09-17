// 나이대 / 성별 / 직종 구분. 데이터 JSON과 화면이 공유하는 축이다.
//
// 직종(職種)을 쓰고 산업(産業)은 쓰지 않는다.
// 산업은 회사가 하는 일이라 IT 회사의 경리도 "정보통신업"으로 잡히는 반면,
// 직종은 본인이 하는 일이라 "나 어느 정도일까?"에 맞는 구분이다.

export const AGE_BANDS = [
  { id: 'all', label: '전체' },
  { id: '20s', label: '20대' },
  { id: '30s', label: '30대' },
  { id: '40s', label: '40대' },
  { id: '50s', label: '50대' },
  { id: '60plus', label: '60대 이상' },
];

export const GENDERS = [
  { id: 'all', label: '전체' },
  { id: 'male', label: '남성' },
  { id: 'female', label: '여성' },
];

export const OCCUPATIONS = [
  { id: 'all', label: '전체' },
  { id: 'management', label: '관리자' },
  { id: 'it', label: 'IT · 정보통신 전문가' },
  { id: 'engineering', label: '공학 전문가 · 기술직' },
  { id: 'health', label: '보건 · 의료 · 복지' },
  { id: 'education', label: '교육 전문가' },
  { id: 'office', label: '사무 종사자' },
  { id: 'sales', label: '영업 · 판매' },
  { id: 'service', label: '서비스 종사자' },
  { id: 'production', label: '기능원 · 장치 · 기계 조작' },
];

export const cellKey = (age, gender, occupation) => `${age}|${gender}|${occupation}`;

/**
 * 표본이 부족할 때 넓혀 볼 순서.
 * 성별 → 직종 → 나이대 순으로 하나씩 푼다.
 * (예: 30대+여성+IT 에서 표본이 모자라면 30대+IT 로 넓힌다)
 */
export function fallbackChain(age, gender, occupation) {
  const chain = [[age, gender, occupation]];
  if (gender !== 'all') chain.push([age, 'all', occupation]);
  if (occupation !== 'all') chain.push([age, 'all', 'all']);
  if (age !== 'all') chain.push(['all', 'all', 'all']);
  return chain.map(([a, g, o]) => ({ age: a, gender: g, occupation: o, key: cellKey(a, g, o) }));
}
