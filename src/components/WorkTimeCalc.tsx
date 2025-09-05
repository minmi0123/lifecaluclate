import React, { useEffect, useState } from 'react';
import './WorkTimeCalc.css';

const WorkTimeCalc: React.FC = () => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [currentTime, setCurrentTime] = useState('');
  const [result, setResult] = useState('');
  const [progress, setProgress] = useState(0);

  // 현재 시간 자동 업데이트
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setCurrentTime(timeString);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateWorkTime = () => {
    if (!startTime || !endTime || !currentTime) {
      alert('모든 시간을 입력해주세요!');
      return;
    }

    try {
      // 시간을 분으로 변환하는 함수
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const currentMinutes = timeToMinutes(currentTime);

      // 총 근무 시간
      const totalWorkMinutes = endMinutes - startMinutes;
      
      // 현재까지 일한 시간
      const workedMinutes = currentMinutes - startMinutes;
      
      // 남은 시간
      const remainingMinutes = endMinutes - currentMinutes;

      // 진행률 계산
      const progressPercent = Math.max(0, Math.min(100, (workedMinutes / totalWorkMinutes) * 100));

      if (workedMinutes < 0) {
        setResult('아직 출근 시간이 안 됐어요! 😴');
        setProgress(0);
      } else if (remainingMinutes <= 0) {
        setResult('퇴근 시간이 지났어요! 🎉\n오늘도 수고하셨어요!');
        setProgress(100);
      } else {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        
        let message = `퇴근까지 ${hours}시간 ${minutes}분 남았습니다! ⏰`;
        
        if (progressPercent < 25) {
          message += '\n\n아직 하루가 시작이에요! 💪';
        } else if (progressPercent < 50) {
          message += '\n\n점심 시간! 🍽️';
        } else if (progressPercent < 75) {
          message += '\n\n오후도 화이팅! 🔥';
        } else {
          message += '\n\n거의 다 왔어요! 🏃‍♂️';
        }

        setResult(message);
        setProgress(progressPercent);
      }
    } catch (error) {
      alert('시간 형식이 올바르지 않습니다. (HH:MM 형식으로 입력해주세요)');
    }
  };

  const resetAll = () => {
    setStartTime('09:00');
    setEndTime('18:00');
    setResult('');
    setProgress(0);
  };

  // 시간 조절 함수들
  const adjustTime = (timeStr: string, minutes: number, setter: (time: string) => void) => {
    try {
      const [hours, mins] = timeStr.split(':').map(Number);
      let totalMinutes = hours * 60 + mins + minutes;
      
      // 24시간 넘어가면 0으로, 음수면 23:30으로
      if (totalMinutes >= 24 * 60) {
        totalMinutes = 0;
      } else if (totalMinutes < 0) {
        totalMinutes = 23 * 60 + 30;
      }
      
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      const newTime = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
      setter(newTime);
    } catch (error) {
      // 에러 발생시 기본값으로 설정
      setter('09:00');
    }
  };

  const TimeInputWithControls = ({ 
    value, 
    onChangeText, 
    placeholder 
  }: { 
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder: string; 
  }) => (
    <div className="time-input-container">
      <button 
        className="time-button" 
        onClick={() => adjustTime(value, 30, onChangeText)}
        type="button"
      >
        ▲
      </button>
      
      <input
        className="time-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        type="time"
      />
      
      <button 
        className="time-button" 
        onClick={() => adjustTime(value, -30, onChangeText)}
        type="button"
      >
        ▼
      </button>
    </div>
  );

  return (
    <div className="container">
      <div className="scroll-container">
        <h1 className="title">🕒 퇴근 시간 계산기 🕒</h1>
      
        <div className="input-container">
          <div className="input-row">
            <label className="input-label">출근 시간:</label>
            <TimeInputWithControls
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
            />
          </div>

          <div className="input-row">
            <label className="input-label">퇴근 시간:</label>
            <TimeInputWithControls
              value={endTime}
              onChangeText={setEndTime}
              placeholder="18:00"
            />
          </div>

          <div className="input-row">
            <label className="input-label">현재 시간:</label>
            <div className="current-time">{currentTime}</div>
          </div>
        </div>

        <button 
          className="calculate-button" 
          onClick={calculateWorkTime}
          type="button"
        >
          ⏰ 계산하기
        </button>

        {result && (
          <div className="result-container">
            <h2 className="result-title">📊 오늘의 근무 현황</h2>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">
                지금까지 일한 시간: {progress.toFixed(1)}%
              </div>
            </div>

            <div className="result" style={{ whiteSpace: 'pre-line' }}>{result}</div>

            <button 
              className="reset-button" 
              onClick={resetAll}
              type="button"
            >
              🔄 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTimeCalc;
