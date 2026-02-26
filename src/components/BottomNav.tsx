import React from 'react';
import { Home, FolderOpen, Upload, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

type NavItem = 'dashboard' | 'files' | 'upload' | 'camera';

interface BottomNavProps {
  active: NavItem;
  onChange: (item: NavItem) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bg-white border-t border-slate-100 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <NavItem 
        icon={<Home size={22} />} 
        label="Beranda" 
        active={active === 'dashboard'} 
        onClick={() => onChange('dashboard')} 
      />
      <NavItem 
        icon={<FolderOpen size={22} />} 
        label="File" 
        active={active === 'files'} 
        onClick={() => onChange('files')} 
      />
      <NavItem 
        icon={<Upload size={22} />} 
        label="Upload" 
        active={active === 'upload'} 
        onClick={() => onChange('upload')} 
      />
      <NavItem 
        icon={<Camera size={22} />} 
        label="Kamera" 
        active={active === 'camera'} 
        onClick={() => onChange('camera')} 
      />
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-emerald-600 scale-110" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-1 rounded-xl transition-colors",
        active ? "bg-emerald-50" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
