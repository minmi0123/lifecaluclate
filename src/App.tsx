import { useEffect, useState } from 'react'
import SalaryStats from './components/SalaryStats'
import RichCalc from './components/RichCalc'
import SavingsCalc from './components/SavingsCalc'
import CoffeeCalc from './components/CoffeeCalc'
import './App.css'

// 한 페이지에 순서대로 쌓이는 구역들. 탭을 누르면 해당 구역으로 스크롤한다.
const sections = [
  { id: 'salary', label: '📊 월급', Component: SalaryStats },
  { id: 'rich', label: '💸 부자', Component: RichCalc },
  { id: 'savings', label: '💰 저축', Component: SavingsCalc },
  { id: 'coffee', label: '☕ 커피', Component: CoffeeCalc },
]

function App() {
  const [activeId, setActiveId] = useState(sections[0].id)

  // 스크롤 위치를 따라 활성 탭을 옮긴다.
  // rootMargin 으로 화면 위쪽(탭바 아래) 띠만 판정 구간으로 삼는다.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-72px 0px -60% 0px' },
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // 주소에 #rich 같은 해시를 달고 들어오면 그 구역에서 시작한다.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && sections.some((s) => s.id === id)) {
      document.getElementById(id)?.scrollIntoView()
    }
  }, [])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 뒤로가기 기록을 남기지 않고 주소만 갱신한다.
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <div className="App">
      <nav className="tab-container">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab-button ${activeId === id ? 'active' : ''}`}
            onClick={() => goTo(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="sections">
        {sections.map(({ id, Component }) => (
          <section key={id} id={id} className="section">
            <Component />
          </section>
        ))}
      </main>
    </div>
  )
}

export default App
