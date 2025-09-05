export interface Target {
  name: string;
  price: number;
  emoji: string;
  message: string;
}

export const targets: Target[] = [
  { name: '서울 아파트', price: 1300000000, emoji: '🏠', message: '' },
  { name: '벤츠 G바겐', price: 260000000, emoji: '🚗', message: '' },
  { name: '프라이빗 제트기', price: 10000000000, emoji: '✈️', message: '' },
  { name: '한남더힐 펜트하우스', price: 9000000000, emoji: '🏢', message: '' },
  { name: '에어팟 프로', price: 350000, emoji: '🎧', message: '' },
  { name: '맥북 에어 M2', price: 1800000, emoji: '💻', message: '' },
  { name: '샤넬 클래식 플랩백', price: 13000000, emoji: '👜', message: '' },
  { name: '루이비통 알마 BB', price: 2500000, emoji: '🧳', message: '' },
  { name: '롤렉스 데이토나', price: 50000000, emoji: '⌚', message: '' },
  { name: '까르띠에 러브팔찌', price: 9000000, emoji: '💫', message: '' },
  { name: '에르메스 버킨백', price: 25000000, emoji: '👜', message: '' },
  { name: '게이밍 컴퓨터 풀세트', price: 3500000, emoji: '🖥️', message: '' },
  { name: 'PS5 + 게임 5개', price: 1200000, emoji: '🎮', message: '' },
  { name: '카메라 바디 + 렌즈 세트', price: 5000000, emoji: '📷', message: '' },
  { name: '골프 풀세트 + 레슨 10회', price: 7000000, emoji: '🏌️', message: '' },
  { name: '다이슨 에어랩', price: 800000, emoji: '💨', message: '' },
  { name: 'LG 스탠바이미', price: 1200000, emoji: '📺', message: '' },
  { name: '루프탑 바 1회 플렉스', price: 200000, emoji: '🍸', message: '' },
  { name: '명품 향수 1병', price: 350000, emoji: '🌸', message: '' },

];
