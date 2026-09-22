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

// 한국표준직업분류 8차 대분류. MDIS 공공용 자료가 대분류까지만 제공한다.
// (중분류는 인가용에서만 제공돼 웹 공개와 맞지 않는다)
// 코드 A(군인)는 2025년 8월 조사 응답이 0건이라 뺐다.
export const OCCUPATIONS = [
  { id: 'all', label: '전체' },
  { id: 'management', label: '관리자' },
  { id: 'professional', label: '전문가 및 관련 종사자' },
  { id: 'office', label: '사무 종사자' },
  { id: 'service', label: '서비스 종사자' },
  { id: 'sales', label: '판매 종사자' },
  { id: 'agriculture', label: '농림어업 숙련 종사자' },
  { id: 'craft', label: '기능원 및 관련 기능 종사자' },
  { id: 'machine', label: '장치·기계 조작 및 조립 종사자' },
  { id: 'labor', label: '단순 노무 종사자' },
];

/**
 * 회사 규모.
 *
 * 조사표 18번은 `300~499명` 과 `500명 이상` 을 나눠 묻지만, 공공용 자료는
 * 둘을 합쳐 `300명 이상` 하나로 내려준다. 그래서 여기도 6구간이 끝이고,
 * "500명 이상 대기업" 만 따로 보는 것은 이 자료로는 불가능하다.
 */
export const COMPANY_SIZES = [
  { id: 'lt5', label: '1-4명' },
  { id: 'to9', label: '5-9명' },
  { id: 'to29', label: '10-29명' },
  { id: 'to99', label: '30-99명' },
  { id: 'to299', label: '100-299명' },
  { id: 'over300', label: '300명+' },
];

/**
 * 근속기간.
 *
 * `현재일관련사항_직장시작연월` 과 `조사연월` 의 차이로 구한다.
 * 20대는 10년 이상 칸이 비는 것이 정상이다(그 나이에 불가능하다).
 */
export const TENURE_BANDS = [
  { id: 'lt1y', label: '1년미만', maxMonths: 11 },
  { id: 'to3y', label: '1~3년', maxMonths: 35 },
  { id: 'to5y', label: '3~5년', maxMonths: 59 },
  { id: 'to10y', label: '5~10년', maxMonths: 119 },
  { id: 'to20y', label: '10~20년', maxMonths: 239 },
  { id: 'over20y', label: '20년+', maxMonths: Infinity },
];

export const cellKey = (age, gender, occupation) => `${age}|${gender}|${occupation}`;

/**
 * breakdowns 용 키. cells 와 섞이지 않도록 따로 둔다.
 * 그래프가 여럿이므로 이름을 앞에 붙여 서로 겹치지 않게 한다.
 */
export const gridKey = (name, row, col) => `${name}|${row}>${col}`;

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
