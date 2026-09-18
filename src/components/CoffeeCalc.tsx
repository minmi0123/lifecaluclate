import React, { useState } from 'react';
import './CoffeeCalc.css';

const COFFEE_PRICE = 3000; // 1잔 가격 고정 3천원
const DAYS_PER_YEAR = 365;

/** "12잔" → 12. 숫자가 아니면 0. */
const toNumber = (text: string) => Number(text.replace(/[^0-9]/g, '')) || 0;

/**
 * ▲▼ 버튼이 달린 숫자 입력칸.
 * 컴포넌트 밖에 두어야 한다. 안에서 정의하면 글자를 칠 때마다 다시
 * 만들어지면서 입력칸이 통째로 교체돼 포커스가 빠진다.
 */
const StepperInput: React.FC<{
  value: string;
  suffix: string;
  step: number;
  label: string;
  onChange: (next: string) => void;
}> = ({ value, suffix, step, label, onChange }) => (
  <div className="coffee-field">
    <span className="coffee-field-label">{label}</span>
    <div className="count-input-container">
      <button
        className="count-button"
        type="button"
        aria-label={`${label} 늘리기`}
        onClick={() => onChange(`${toNumber(value) + step}${suffix}`)}
      >
        ▲
      </button>

      <div className="count-input-wrapper">
        <input
          className="count-input"
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(`${e.target.value.replace(/[^0-9]/g, '')}${suffix}`)}
        />
      </div>

      <button
        className="count-button"
        type="button"
        aria-label={`${label} 줄이기`}
        onClick={() => onChange(`${Math.max(0, toNumber(value) - step)}${suffix}`)}
      >
        ▼
      </button>
    </div>
  </div>
);

interface CoffeeResult {
  headline: string;
  /** 월급을 안 넣었으면 비어 있다. */
  shareLabel: string;
  sharePercent: string;
  days: string;
  comment: string;
}

const CoffeeCalc: React.FC = () => {
  const [salary, setSalary] = useState('300만원');
  const [coffeeCount, setCoffeeCount] = useState('1잔');
  const [result, setResult] = useState<CoffeeResult | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    const dailyCups = toNumber(coffeeCount);
    if (dailyCups <= 0) {
      setError('하루에 몇 잔 마시는지 입력해주세요!');
      setResult(null);
      return;
    }

    const yearlyCups = dailyCups * DAYS_PER_YEAR;
    const yearlyCost = yearlyCups * COFFEE_PRICE;
    const headline = `1년에 ${yearlyCups.toLocaleString()}잔 · ${Math.round(yearlyCost / 10000).toLocaleString()}만원`;

    const monthlySalary = toNumber(salary) * 10000;
    if (monthlySalary <= 0) {
      // 월급 없이도 쓴 돈은 알려주고, 비율은 월급을 넣어야 나온다고 안내한다.
      setError('');
      setResult({
        headline,
        shareLabel: '',
        sharePercent: '',
        days: '',
        comment: '월급을 입력하면 연봉의 몇 %인지도 알려드려요 ☕',
      });
      return;
    }

    const yearlySalary = monthlySalary * 12;
    const sharePercent = (yearlyCost / yearlySalary) * 100;
    // 연봉을 365일로 나눠 하루치를 구하고, 커피값이 그 며칠치인지 본다.
    const days = yearlyCost / (yearlySalary / DAYS_PER_YEAR);

    let comment: string;
    if (sharePercent >= 100) comment = '😵 월급보다 커피값이 많아요';
    else if (sharePercent >= 10) comment = '😱 사실상 고정지출이네요';
    else if (sharePercent >= 5) comment = '🥲 한 잔만 줄여도 달라져요';
    else if (sharePercent >= 2) comment = '☕ 이 정도면 국룰이죠';
    else comment = '👍 커피엔 꽤 절제하시네요';

    setError('');
    setResult({
      headline,
      shareLabel: `내 연봉 ${Math.round(yearlySalary / 10000).toLocaleString()}만원의`,
      sharePercent: `${sharePercent.toFixed(1)}%`,
      days: days >= 1
        ? `1년 중 ${days >= 10 ? Math.round(days) : days.toFixed(1)}일은 커피값 벌려고 일한 셈이에요`
        : '1년 중 하루치 일당도 안 되네요',
      comment,
    });
  };

  const resetAll = () => {
    setSalary('300만원');
    setCoffeeCount('1잔');
    setResult(null);
    setError('');
  };

  return (
    <div className="container">
      <div className="scroll-container">
        <h1 className="title">☕ 커피값 계산기 ☕</h1>

        <div className="price-info">
          <div className="price-text">1잔 가격: 3,000원</div>
        </div>

        <div className="input-container">
          <StepperInput
            label="내 월급"
            value={salary}
            suffix="만원"
            step={10}
            onChange={setSalary}
          />
          <StepperInput
            label="하루 커피"
            value={coffeeCount}
            suffix="잔"
            step={1}
            onChange={setCoffeeCount}
          />
        </div>

        <button className="calculate-button" onClick={calculate} type="button">
          💰 계산하기
        </button>

        {error && <div className="coffee-error">{error}</div>}

        {result && (
          <div className="result-container">
            <div className="result-area">
              <h2 className="result-title">📊 계산 결과</h2>
              <div className="result">{result.headline}</div>
              {result.sharePercent && (
                <>
                  <div className="coffee-share-label">{result.shareLabel}</div>
                  <div className="coffee-share">{result.sharePercent}</div>
                  <div className="result coffee-days">{result.days}</div>
                </>
              )}
              <div className="result">{result.comment}</div>
            </div>

            <div className="button-container">
              <button className="reset-button" onClick={resetAll} type="button">
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
