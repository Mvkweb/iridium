/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Antinuke } from './pages/antinuke/Antinuke';
import { Profiler } from './pages/profiler/Profiler';
import { useState, useEffect } from 'react';
import { iridiumClient } from './lib/websocket';

export default function App() {
  const [activeView, setActiveView] = useState('Overview');
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    iridiumClient.on('auth_success', () => setAuthState('authenticated'));
    iridiumClient.on('auth_failed', (data) => {
      setAuthState('unauthenticated');
      if (data?.message) setAuthError(data.message);
    });
    iridiumClient.on('auth_required', () => setAuthState('unauthenticated'));
    iridiumClient.on('disconnected', () => setAuthState('loading'));
    
    // Check if URL has steam openid response to show loading state while verifying
    if (window.location.search.includes('openid.mode')) {
      setAuthState('loading');
    }

    iridiumClient.connect();

    return () => {
      // cleanup listeners
    };
  }, []);

  if (authState === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A] text-zinc-300 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-600 border-t-blue-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Connecting to Iridium backend...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A] text-zinc-300 font-sans">
        <div className="flex flex-col items-center max-w-sm w-full text-center">
          
          <h1 className="text-xl font-medium text-zinc-100 mb-2 tracking-tight">Dashboard Access</h1>
          <p className="text-zinc-500 text-sm mb-6">
            Sign in through Steam to verify your permissions.
          </p>
          
          {authError && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
              {authError}
            </div>
          )}

          <button 
            onClick={() => iridiumClient.loginWithSteam()}
            className="flex items-center justify-center gap-3 w-64 bg-[#141414] hover:bg-[#1A1A1A] border border-zinc-800 text-zinc-200 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.4 3.4 0 0 1 1.912-.59q.094.001.188.006l2.861-4.142V8.91a4.53 4.53 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911l.004.159a3.39 3.39 0 0 1-3.39 3.396a3.41 3.41 0 0 1-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0M7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25a2.551 2.551 0 0 0 3.337-3.324a2.547 2.547 0 0 0-3.255-1.413l1.523.63a1.878 1.878 0 0 1-1.445 3.467zm11.415-9.303a3.02 3.02 0 0 0-3.015-3.015a3.015 3.015 0 1 0 3.015 3.015m-5.273-.005a2.264 2.264 0 1 1 4.531 0a2.267 2.267 0 0 1-2.266 2.265a2.264 2.264 0 0 1-2.265-2.265"/>
            </svg>
            Sign in with Steam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden selection:bg-blue-500/30">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeView} setActiveItem={setActiveView} />
        {activeView === 'Workflow' && <Canvas />}
        {activeView === 'Overview' && <Dashboard />}
        {activeView === 'Antinuke' && <Antinuke />}
        {activeView === 'Profiler' && <Profiler />}
      </div>
    </div>
  );
}
