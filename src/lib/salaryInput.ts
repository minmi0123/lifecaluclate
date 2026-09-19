/**
 * 네 구역이 월급 하나를 같이 쓴다. 월급 구역에서만 입력받고,
 * 나머지 구역은 그 값을 읽기만 한다.
 */

/** 화면에 두는 월급 표기. "300만원" 처럼 단위가 붙은 문자열. */
export const DEFAULT_SALARY = '300만원';

/** "300만원" → 300. 숫자가 아니면 0. */
export const toManwon = (text: string) => Number(text.replace(/[^0-9]/g, '')) || 0;

/** "300만원" → 3000000 (원). */
export const toWon = (text: string) => toManwon(text) * 10000;
