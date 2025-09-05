import React, { useState } from 'react';
import './RichCalc.css';
import { targets, type Target } from '../data/targets';

const RichCalc: React.FC = () => {
  const [salary, setSalary] = useState('100만원');
  const [result, setResult] = useState('');
  const [result2, setResult2] = useState('');

  const calculate = () => {
    // '만원' 단위 제거하고 숫자만 추출
    const salaryNumber = parseFloat(salary.replace('만원', ''));
    const yearly = salaryNumber * 10000 * 12;

    if (isNaN(yearly) || yearly <= 0) {
      setResult('정확한 월급을 입력해주세요!');
      setResult2('');
      return;
    }

    // 랜덤으로 하나의 타겟 선택
    const randomIndex = Math.floor(Math.random() * targets.length);
    const selectedTarget = targets[randomIndex];

    // 결과 계산
    const years = selectedTarget.price / yearly;
    const resultText = `${selectedTarget.name} 사려면 약 ${Math.ceil(years)}년 걸려요 ${selectedTarget.emoji}`;

    // 결론 문구
    let conclusionText = '';
    if (years >= 100) {
      conclusionText = `${selectedTarget.message}\n💀 현생에서는 불가능할지도...`;
    } else if (years >= 30) {
      conclusionText = `${selectedTarget.message}\n🥹 희망을 잃지 마세요`;
    } else if (years >= 10) {
      conclusionText = `${selectedTarget.message}\n🔥 오 가능성 있어요!`;
    } else {
      conclusionText = `${selectedTarget.message}\n🎉 지금 당장 사러갑시당`;
    }

    setResult(resultText);
    setResult2(conclusionText);
  };


  const resetAll = () => {
    setSalary('100만원');
    setResult('');
    setResult2('');
  };

  // 금액 조절 함수들 (50만원씩)
  const adjustAmount = (amountStr: string, increment: number, setter: (amount: string) => void) => {
    try {
      // '만원' 단위 제거하고 숫자만 추출
      const currentAmount = parseFloat(amountStr.replace('만원', '')) || 0;
      let newAmount = currentAmount + increment;
      
      // 최소값 0으로 제한
      if (newAmount < 0) {
        newAmount = 0;
      }
      
      setter(newAmount.toString() + '만원');
    } catch (error) {
      // 에러 발생시 기본값으로 설정
      setter('100만원');
    }
  };

  const AmountInputWithControls = ({ 
    value, 
    onChangeText, 
    placeholder,
    suffix 
  }: { 
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder: string;
    suffix: string;
  }) => (
    <div className="amount-input-container">
      <button 
        className="amount-button" 
        onClick={() => adjustAmount(value, 50, onChangeText)}
        type="button"
      >
        ▲
      </button>
      
      <div className="amount-input-wrapper">
        <input
          className="amount-input"
          placeholder={placeholder}
          type="text"
          onChange={(e) => {
            const inputValue = e.target.value;
            // 숫자만 추출해서 만원 붙이기
            const numbers = inputValue.replace(/[^0-9]/g, '');
            onChangeText(numbers + '만원');
          }}
          value={value}
        />
      </div>
      
      <button 
        className="amount-button" 
        onClick={() => adjustAmount(value, -50, onChangeText)}
        type="button"
      >
        ▼
      </button>
    </div>
  );

  return (
    <div className="container">
      <div className="scroll-container">
        <h1 className="title">💸 부자 계산기 💸</h1>
        
        <div className="input-container">
          <label className="input-label">월급:</label>
          <AmountInputWithControls
            value={salary}
            onChangeText={setSalary}
            placeholder="입력하세요"
            suffix=""
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

export default RichCalc;
