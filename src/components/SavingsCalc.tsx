import React, { useState } from 'react';
import './SavingsCalc.css';
import { toWon } from '../lib/salaryInput';
import { formatManwon } from '../lib/salaryStats';

/**
 * ▲▼ 버튼이 달린 금액 입력칸. 단위(만원/억원)와 증감폭을 받는다.
 * 컴포넌트 밖에 두어야 한다. 안에서 정의하면 글자를 칠 때마다 다시
 * 만들어지면서 입력칸이 통째로 교체돼 포커스가 빠진다.
 */
const AmountInputWithControls = ({
  value,
  onChangeText,
  increment = 50,
  unit,
}: {
  value: string;
  onChangeText: (text: string) => void;
  increment?: number;
  unit: string;
}) => {
  // 단위를 떼고 숫자만 더한 뒤 다시 붙인다. 최소 0.
  const adjust = (step: number) => {
    const current = parseFloat(value.replace(unit, '')) || 0;
    onChangeText(`${Math.max(0, current + step)}${unit}`);
  };

  return (
    <div className="savings-amount-input-container">
      <button className="savings-amount-button" onClick={() => adjust(increment)} type="button">
        ▲
      </button>

      <div className="savings-amount-input-wrapper">
        <input
          className="savings-amount-input"
          type="text"
          inputMode="numeric"
          onChange={(e) => onChangeText(`${e.target.value.replace(/[^0-9]/g, '')}${unit}`)}
          value={value}
        />
      </div>

      <button className="savings-amount-button" onClick={() => adjust(-increment)} type="button">
        ▼
      </button>
    </div>
  );
};

const SavingsCalc: React.FC<{ salary: string }> = ({ salary }) => {
  const [savings, setSavings] = useState('50만원');
  const [target, setTarget] = useState('10000만원');
  const [result, setResult] = useState('');
  const [result2, setResult2] = useState('');

  const calculate = () => {
    const salaryNum = toWon(salary);
    const savingsNum = toWon(savings);
    const targetNum = toWon(target);

    if (salaryNum <= 0) {
      setResult('위 월급 칸에 월급을 입력해주세요.');
      setResult2('');
      return;
    }
    if (savingsNum <= 0 || targetNum <= 0) {
      setResult('저축액과 목표 금액을 입력해주세요.');
      setResult2('');
      return;
    }
    if (savingsNum > salaryNum) {
      setResult('저축액이 월급보다 클 수 없어요!');
      setResult2('');
      return;
    }

    const savingsRate = (savingsNum / salaryNum) * 100;
    const months = targetNum / savingsNum;
    const years = Math.floor(months / 12);
    const remainingMonths = Math.floor(months % 12);

    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());

    let resultText = `월급: ${salary}\n`;
    resultText += `저축: ${savings} → 저축률 ${savingsRate.toFixed(1)}%\n\n`;
    resultText += `목표 금액: ${formatManwon(targetNum)}\n`;
    resultText += `도달까지: 약 ${Math.ceil(months)}개월 (${years}년 ${remainingMonths}개월)\n\n`;
    resultText += `목표 달성 예상일: ${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`;

    setResult(resultText);

    if (savingsRate >= 50) setResult2('절약왕이시네요! 부자될 각!');
    else if (savingsRate >= 30) setResult2('착실히 모으고 계세요!');
    else if (savingsRate >= 10) setResult2('조금 더 아껴보면 어떨까요?');
    else setResult2('지출 점검이 필요할지도...');
  };

  const resetAll = () => {
    setSavings('50만원');
    setTarget('10000만원');
    setResult('');
    setResult2('');
  };

  return (
    <div className="savings-container">
      <div className="savings-scroll-container">
        <h1 className="savings-title">저축률 계산기</h1>

        <p className="savings-salary-note">
          {toWon(salary) > 0
            ? <>월급 <strong>{salary}</strong> 기준</>
            : '맨 위 월급 칸에 월급을 입력해주세요'}
        </p>

        <div className="savings-input-container">
          <label className="savings-input-label">저축:</label>
          <AmountInputWithControls value={savings} onChangeText={setSavings} unit="만원" />
        </div>

        <div className="savings-input-container">
          <label className="savings-input-label">목표:</label>
          <AmountInputWithControls value={target} onChangeText={setTarget} increment={1000} unit="만원" />
          {/* 10000만원이 한눈에 1억으로 안 읽혀서 환산해 보여준다. */}
          <p className="savings-amount-hint">= {formatManwon(toWon(target))}</p>
        </div>

        <button className="savings-calculate-button" onClick={calculate} type="button">
          계산하기
        </button>

        {result && (
          <div className="savings-result-container">
            <div className="savings-result-area">
              <h2 className="savings-result-title">계산 결과</h2>
              <div className="savings-result" style={{ whiteSpace: 'pre-line' }}>{result}</div>
              <div className="savings-result">{result2}</div>
            </div>

            <div className="savings-button-container">
              <button className="savings-reset-button" onClick={resetAll} type="button">
                초기화
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsCalc;
