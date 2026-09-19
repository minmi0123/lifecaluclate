import React, { useState } from 'react';
import './RichCalc.css';
import { targets } from '../data/targets';
import { toWon } from '../lib/salaryInput';

const RichCalc: React.FC<{ salary: string }> = ({ salary }) => {
  const [result, setResult] = useState('');
  const [result2, setResult2] = useState('');

  const calculate = () => {
    const yearly = toWon(salary) * 12;

    if (yearly <= 0) {
      setResult('위 월급 칸에 월급을 입력해주세요.');
      setResult2('');
      return;
    }

    // 랜덤으로 하나의 타겟 선택
    const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    const years = selectedTarget.price / yearly;

    setResult(`${selectedTarget.name} 사려면 약 ${Math.ceil(years)}년 걸려요`);

    if (years >= 100) setResult2('현생에서는 불가능할지도...');
    else if (years >= 30) setResult2('희망을 잃지 마세요');
    else if (years >= 10) setResult2('오 가능성 있어요!');
    else setResult2('지금 당장 사러갑시당');
  };

  const resetAll = () => {
    setResult('');
    setResult2('');
  };

  return (
    <div className="rich-container">
      <div className="rich-scroll-container">
        <h1 className="rich-title">부자 계산기</h1>

        <p className="rich-salary-note">
          {toWon(salary) > 0
            ? <>월급 <strong>{salary}</strong> 기준</>
            : '맨 위 월급 칸에 월급을 입력해주세요'}
        </p>

        <button className="rich-calculate-button" onClick={calculate} type="button">
          계산하기
        </button>

        {result && (
          <div className="rich-result-container">
            <div className="rich-result-area">
              <h2 className="rich-result-title">계산 결과</h2>
              <div className="rich-result">{result}</div>
              <div className="rich-result">{result2}</div>
            </div>

            <div className="rich-button-container">
              <button className="rich-reset-button" onClick={resetAll} type="button">
                초기화
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichCalc;
