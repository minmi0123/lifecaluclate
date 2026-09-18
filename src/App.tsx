import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import SalaryStats from './components/SalaryStats'
import RichCalc from './components/RichCalc'
import SavingsCalc from './components/SavingsCalc'
import CoffeeCalc from './components/CoffeeCalc'
import './App.css'

const BASE = '/lifecaluclate'

// 첫 항목이 기본 화면. aliases 는 같은 탭으로 볼 경로들.
const tabs = [
  { path: `${BASE}/salary`, label: '📊 월급', aliases: [BASE, `${BASE}/`] },
  { path: `${BASE}/rich`, label: '💸 부자', aliases: [] },
  { path: `${BASE}/savings`, label: '💰 저축', aliases: [] },
  { path: `${BASE}/coffee`, label: '☕ 커피', aliases: [] },
]

function App() {
  const location = useLocation()

  return (
    <div className="App">
      <div className="tab-container">
        {tabs.map((tab) => {
          const isActive = tab.path === location.pathname || tab.aliases.includes(location.pathname)
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`tab-button ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Routes>
        <Route path="/" element={<Navigate to={BASE} replace />} />
        <Route path={BASE} element={<SalaryStats />} />
        <Route path={`${BASE}/salary`} element={<SalaryStats />} />
        <Route path={`${BASE}/rich`} element={<RichCalc />} />
        <Route path={`${BASE}/savings`} element={<SavingsCalc />} />
        <Route path={`${BASE}/coffee`} element={<CoffeeCalc />} />
        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    </div>
  )
}

export default App
