import React from 'react'
import { Sun } from 'lucide-react'
import { FiGithub } from 'react-icons/fi'

export default function App(){
  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="text-2xl font-bold mb-4">Lunar Dashboard</h2>
        <ul className="space-y-2 text-sm">
          <li className="p-2 rounded hover:bg-gray-800">Ice Detection</li>
          <li className="p-2 rounded hover:bg-gray-800">Top Deposits</li>
          <li className="p-2 rounded hover:bg-gray-800">Safe Sites</li>
          <li className="p-2 rounded hover:bg-gray-800">Path Planner</li>
          <li className="p-2 rounded hover:bg-gray-800">AI Prediction</li>
        </ul>
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <Sun /> <span>Built with React</span>
        </div>
      </aside>
      <main className="main">
        <h1 className="text-3xl font-semibold">Welcome</h1>
        <p className="mt-2 text-gray-300">Use the left panel to navigate the demo features.</p>
        <div className="mt-6">
          <button className="px-4 py-2 bg-blue-500 rounded text-white flex items-center gap-2"><FiGithub /> View source</button>
        </div>
      </main>
    </div>
  )
}
