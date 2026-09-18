import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Clock, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Map', Icon: Map },
  { path: '/sessions', label: 'Sessions', Icon: Clock },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around py-2 px-4 safe-area-inset-bottom">
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
              active ? 'text-violet-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
