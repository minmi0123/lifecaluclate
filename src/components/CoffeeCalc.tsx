import React, { useState } from 'react';
import './CoffeeCalc.css';

const CoffeeCalc: React.FC = () => {
  const [coffeeCount, setCoffeeCount] = useState('1잔');
  const [result, setResult] = useState('');
  const [result2, setResult2] = useState('');

  const COFFEE_PRICE = 3000; // 고정 1잔 가격 3천원
  const AIRPODS_PRO_PRICE = 350000; // 에어팟 프로 가격 (대략 35만원)

  const calculate = () => {
    const dailyCount = parseFloat(coffeeCount);

    if (isNaN(dailyCount) || dailyCount <= 0) {
      setResult('정확한 하루 커피 횟수를 입력해주세요!');
      setResult2('');
      return;
    }

    const yearlyCups = dailyCount * 365;
    const yearlyCost = yearlyCups * COFFEE_PRICE;
    const yearlyCostInManwon = Math.round(yearlyCost / 10000);
    
    const airpodsCount = Math.floor(yearlyCost / AIRPODS_PRO_PRICE);

    setResult(`1년 동안 ${yearlyCups}잔 = 총 ${yearlyCostInManwon}만원 사용`);
    
    if (airpodsCount > 0) {
      setResult2(`그 돈으로 에어팟 프로 ${airpodsCount}개 살 수 있었어요 🎧`);
    } else {
      setResult2('아직 에어팟 프로는 못 사지만... 조금만 더! ☕');
    }
  };

  const resetAll = () => {
    setCoffeeCount('1잔');
    setResult('');
    setResult2('');
  };

  // 커피 횟수 조절 함수들 (1잔씩)
  const adjustCount = (countStr: string, increment: number, setter: (count: string) => void) => {
    try {
      const currentCount = parseFloat(countStr.replace('잔', '')) || 0;
      let newCount = currentCount + increment;
      
      // 최소값 0으로 제한
      if (newCount < 0) {
        newCount = 0;
      }
      
      setter(newCount.toString() + '잔');
    } catch (error) {
      // 에러 발생시 기본값으로 설정
      setter('1잔');
    }
  };

  const CountInputWithControls = ({ 
    value, 
    onChangeText, 
    placeholder
  }: { 
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder: string;
  }) => (
    <div className="count-input-container">
      <button 
        className="count-button" 
        onClick={() => adjustCount(value, 1, onChangeText)}
        type="button"
      >
        ▲
      </button>
      
      <div className="count-input-wrapper">
        <input
          className="count-input"
          placeholder={placeholder}
          type="text"
          onChange={(e) => {
            const inputValue = e.target.value;
            // 숫자만 추출해서 잔 붙이기
            const numbers = inputValue.replace(/[^0-9]/g, '');
            onChangeText(numbers + '잔');
          }}
          value={value}
        />
      </div>
      
      <button 
        className="count-button" 
        onClick={() => adjustCount(value, -1, onChangeText)}
        type="button"
      >
        ▼
      </button>
    </div>
  );

  return (
    <div className="container">
      <div className="scroll-container">
        <h1 className="title">☕ 커피값 계산기 ☕</h1>
      
        <div className="price-info">
          <div className="price-text">1잔 가격: 3,000원</div>
        </div>
        
        <div className="input-container">
          <CountInputWithControls
            value={coffeeCount}
            onChangeText={setCoffeeCount}
            placeholder="입력하세요"
          />
        </div>
        
        <button 
          className="calculate-button" 
          onClick={calculate}
          type="button"
        >
          💰 계산하기
        </button>
        
        {result && (
          <div className="result-container">
            <div className="result-area">
              <h2 className="result-title">📊 계산 결과</h2>
              <div className="result" style={{ whiteSpace: 'pre-line' }}>{result}</div>
              <div className="result" style={{ whiteSpace: 'pre-line' }}>{result2}</div>
            </div>
            
            <div className="button-container">
              <button 
                className="reset-button" 
                onClick={resetAll}
                type="button"
              >
                🔄 초기화
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeCalc;
