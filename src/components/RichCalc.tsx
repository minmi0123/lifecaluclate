import React, { useState } from 'react';
import './RichCalc.css';
import { targets } from '../data/targets';

/**
 * ▲▼ 버튼이 달린 금액 입력칸.
 * 컴포넌트 밖에 두어야 한다. 안에서 정의하면 글자를 칠 때마다 다시
 * 만들어지면서 입력칸이 통째로 교체돼 포커스가 빠진다.
 */
const AmountInputWithControls = ({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) => {
  // '만원' 단위를 떼고 숫자만 더한 뒤 다시 붙인다. 최소 0.
  const adjust = (increment: number) => {
    const current = parseFloat(value.replace('만원', '')) || 0;
    onChangeText(`${Math.max(0, current + increment)}만원`);
  };

  return (
    <div className="rich-amount-input-container">
      <button className="rich-amount-button" onClick={() => adjust(50)} type="button">
        ▲
      </button>

      <div className="rich-amount-input-wrapper">
        <input
          className="rich-amount-input"
          placeholder={placeholder}
          type="text"
          inputMode="numeric"
          onChange={(e) => onChangeText(`${e.target.value.replace(/[^0-9]/g, '')}만원`)}
          value={value}
        />
      </div>

      <button className="rich-amount-button" onClick={() => adjust(-50)} type="button">
        ▼
      </button>
    </div>
  );
};

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

  return (
    <div className="rich-container">
      <div className="rich-scroll-container">
        <h1 className="rich-title">💸 부자 계산기 💸</h1>
        
        <div className="rich-input-container">
          <label className="rich-input-label">월급:</label>
          <AmountInputWithControls
            value={salary}
            onChangeText={setSalary}
            placeholder="입력하세요"
          />
        </div>
        
        <button 
          className="rich-calculate-button" 
          onClick={calculate}
          type="button"
        >
          💰 계산하기
        </button>
        
        {result && (
          <div className="rich-result-container">
            <div className="rich-result-area">
              <h2 className="rich-result-title">📊 계산 결과</h2>
              <div className="rich-result" style={{ whiteSpace: 'pre-line' }}>{result}</div>
              <div className="rich-result" style={{ whiteSpace: 'pre-line' }}>{result2}</div>
            </div>
            
            <div className="rich-button-container">
              <button 
                className="rich-reset-button" 
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
