/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useMusicStore } from './store/musicStore';
import AuraluxeDeviceFrame from './components/AuraluxeDeviceFrame';
import { Loader2, Music } from 'lucide-react';

export default function App() {
  const { init, isDbInitialized } = useMusicStore();

  useEffect(() => {
    // Initialize offline state & default tracks database
    init();
  }, [init]);

  if (!isDbInitialized) {
    return (
      <div className="min-h-screen w-full bg-[#050508] flex flex-col items-center justify-center space-y-4 text-gray-200">
        <div className="relative flex items-center justify-center">
          <Loader2 size={40} className="text-rose-500 animate-spin" />
          <Music size={18} className="text-violet-400 absolute animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xs uppercase font-black tracking-widest text-white leading-none">TYPE-69 Core Engine</h2>
          <p className="text-4xs text-gray-500 font-mono">Initializing persistent offline storage indexes...</p>
        </div>
      </div>
    );
  }

  return <AuraluxeDeviceFrame />;
}

