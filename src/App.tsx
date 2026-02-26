import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import FileManager from './components/FileManager';
import Upload from './components/Upload';
import CameraView from './components/CameraView';
import BottomNav from './components/BottomNav';

type View = 'dashboard' | 'files' | 'upload' | 'camera';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'files':
        return <FileManager />;
      case 'upload':
        return <Upload />;
      case 'camera':
        return <CameraView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav active={currentView} onChange={setCurrentView} />
    </div>
  );
}
