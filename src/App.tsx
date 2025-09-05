import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import RichCalc from './components/RichCalc'
import WorkTimeCalc from './components/WorkTimeCalc'
import SavingsCalc from './components/SavingsCalc'
import CoffeeCalc from './components/CoffeeCalc'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <div className="App">
      <div className="tab-container">
        <Link 
          to="/lifecaluclate/rich"
          className={`tab-button ${location.pathname === '/lifecaluclate/rich' ? 'active' : ''}`}
        >
          💸 부자
        </Link>
        <Link 
          to="/lifecaluclate/worktime"
          className={`tab-button ${location.pathname === '/lifecaluclate/worktime' ? 'active' : ''}`}
        >
          🕒 퇴근
        </Link>
        <Link 
          to="/lifecaluclate/savings"
          className={`tab-button ${location.pathname === '/lifecaluclate/savings' ? 'active' : ''}`}
        >
          💰 저축
        </Link>
        <Link 
          to="/lifecaluclate/coffee"
          className={`tab-button ${location.pathname === '/lifecaluclate/coffee' ? 'active' : ''}`}
        >
          ☕ 커피
        </Link>
      </div>
      
      <Routes>
        <Route path="/" element={<Navigate to="/lifecaluclate" replace />} />
        <Route path="/lifecaluclate" element={<RichCalc />} />
        <Route path="/lifecaluclate/rich" element={<RichCalc />} />
        <Route path="/lifecaluclate/worktime" element={<WorkTimeCalc />} />
        <Route path="/lifecaluclate/savings" element={<SavingsCalc />} />
        <Route path="/lifecaluclate/coffee" element={<CoffeeCalc />} />
      </Routes>
    </div>
  )
}

export default App
