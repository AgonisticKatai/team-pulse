import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚽ TeamPulse</h1>
        <p>Football Team Statistics Platform</p>
      </header>
      
      <main className="app-main">
        <div className="card">
          <h2>Welcome to TeamPulse!</h2>
          <p>Your modern football statistics platform</p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            Clicks: {count}
          </button>
          <p className="status">🚀 Status: Ready for development</p>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Built with React + TypeScript + Vite</p>
      </footer>
    </div>
  )
}

export default App
