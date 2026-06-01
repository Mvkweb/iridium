/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Antinuke } from './pages/antinuke/Antinuke';
import { useState } from 'react';

export default function App() {
  const [activeView, setActiveView] = useState('Overview');

  return (
    <div className="flex h-screen w-full flex-col bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden selection:bg-blue-500/30">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeView} setActiveItem={setActiveView} />
        {activeView === 'Workflow' && <Canvas />}
        {activeView === 'Overview' && <Dashboard />}
        {activeView === 'Antinuke' && <Antinuke />}
      </div>
    </div>
  );
}
