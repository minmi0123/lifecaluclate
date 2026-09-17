import React, { useState } from 'react';
import './SavingsCalc.css';

const SavingsCalc: React.FC = () => {
  const [salary, setSalary] = useState('100만원');
  const [savings, setSavings] = useState('50만원');
  const [target, setTarget] = useState('1억원');
  const [result, setResult] = useState('');
  const [result2, setResult2] = useState('');

  const calculate = () => {
    // 단위 제거하고 숫자만 추출
    const salaryNum = parseFloat(salary.replace('만원', '')) * 10000;
    const savingsNum = parseFloat(savings.replace('만원', '')) * 10000;
    const targetNum = parseFloat(target.replace('억원', '')) * 100000000; // 억 단위

    if (savingsNum > salaryNum) {
      setResult('저축액이 월급보다 클 수 없어요!');
      setResult2('');
      return;
    }
    if (isNaN(salaryNum) || isNaN(savingsNum) || isNaN(targetNum) || 
        salaryNum <= 0 || savingsNum <= 0 || targetNum <= 0) {
      setResult('정확한 값을 입력해주세요!');
      setResult2('');
      return;
    }

    // 저축률 계산
    const savingsRate = (savingsNum / salaryNum) * 100;
    
    // 목표까지 걸리는 기간 (개월)
    const months = targetNum / savingsNum;
    const years = Math.floor(months / 12);
    const remainingMonths = Math.floor(months % 12);

    // 목표 달성 예상일 계산
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());

    // 결과 메시지
    let resultText = `💰 저축률 계산기 💰\n\n`;
    resultText += `월급: ${salary}\n`;
    resultText += `저축: ${savings} → 💾 저축률 ${savingsRate.toFixed(1)}%\n\n`;
    resultText += `목표 금액: ${target}\n`;
    resultText += `도달까지: 약 ${Math.ceil(months)}개월 (${years}년 ${remainingMonths}개월)\n\n`;
    resultText += `📅 목표 달성 예상일: ${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`;

    setResult(resultText);

    // 감성 메시지
    let emotionMessage = '';
    if (savingsRate >= 50) {
      emotionMessage = '🔥 절약왕이시네요! 부자될 각!';
    } else if (savingsRate >= 30) {
      emotionMessage = '💪 착실히 모으고 계세요!';
    } else if (savingsRate >= 10) {
      emotionMessage = '😅 조금 더 아껴보면 어떨까요?';
    } else {
      emotionMessage = '🥲 지출 점검이 필요할지도...';
    }

    setResult2(emotionMessage);
  };

  const resetAll = () => {
    setSalary('100만원');
    setSavings('50만원');
    setTarget('1억원');
    setResult('');
    setResult2('');
  };

  // 금액 조절 함수들
  const adjustAmount = (amountStr: string, increment: number, setter: (amount: string) => void, unit: string) => {
    try {
      // 단위 제거하고 숫자만 추출
      const currentAmount = parseFloat(amountStr.replace(unit, '')) || 0;
      let newAmount = currentAmount + increment;
      
      // 최소값 0으로 제한
      if (newAmount < 0) {
        newAmount = 0;
      }
      
      setter(newAmount.toString() + unit);
    } catch {
      // 에러 발생시 기본값으로 설정
      if (unit === '만원') {
        setter('100만원');
      } else if (unit === '억원') {
        setter('1억원');
      }
    }
  };

  const AmountInputWithControls = ({ 
    value, 
    onChangeText, 
    placeholder,
    increment = 50,
    unit
  }: { 
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder: string;
    increment?: number;
    unit: string;
  }) => (
    <div className="amount-input-container">
      <button 
        className="amount-button" 
        onClick={() => adjustAmount(value, increment, onChangeText, unit)}
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
            // 숫자만 추출해서 단위 붙이기
            const numbers = inputValue.replace(/[^0-9]/g, '');
            onChangeText(numbers + unit);
          }}
          value={value}
        />
      </div>
      
      <button 
        className="amount-button" 
        onClick={() => adjustAmount(value, -increment, onChangeText, unit)}
        type="button"
      >
        ▼
      </button>
    </div>
  );

  return (
    <div className="container">
      <div className="scroll-container">
        <h1 className="title">💰 저축률 계산기 💰</h1>
      
        <div className="input-container">
          <label className="input-label">월급:</label>
          <AmountInputWithControls
            value={salary}
            onChangeText={setSalary}
            placeholder="입력하세요"
            unit="만원"
          />
        </div>

        <div className="input-container">
          <label className="input-label">저축:</label>
          <AmountInputWithControls
            value={savings}
            onChangeText={setSavings}
            placeholder="입력하세요"
            increment={50}
            unit="만원"
          />
        </div>

        <div className="input-container">
          <label className="input-label">목표:</label>
          <AmountInputWithControls
            value={target}
            onChangeText={setTarget}
            placeholder="입력하세요"
            increment={1}
            unit="억원"
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

export default SavingsCalc;
