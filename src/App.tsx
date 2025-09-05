import { Routes, Route, Link, useLocation } from 'react-router-dom'
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
          to="/rich"
          className={`tab-button ${location.pathname === '/rich' ? 'active' : ''}`}
        >
          💸 부자
        </Link>
        <Link 
          to="/worktime"
          className={`tab-button ${location.pathname === '/worktime' ? 'active' : ''}`}
        >
          🕒 퇴근
        </Link>
        <Link 
          to="/savings"
          className={`tab-button ${location.pathname === '/savings' ? 'active' : ''}`}
        >
          💰 저축
        </Link>
        <Link 
          to="/coffee"
          className={`tab-button ${location.pathname === '/coffee' ? 'active' : ''}`}
        >
          ☕ 커피
        </Link>
      </div>
      
      <Routes>
        <Route path="/" element={<RichCalc />} />
        <Route path="/rich" element={<RichCalc />} />
        <Route path="/worktime" element={<WorkTimeCalc />} />
        <Route path="/savings" element={<SavingsCalc />} />
        <Route path="/coffee" element={<CoffeeCalc />} />
      </Routes>
    </div>
  )
}

export default App
