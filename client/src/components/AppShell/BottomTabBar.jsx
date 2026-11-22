import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Wallet, Briefcase, BarChart2, ArrowRightLeft } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/wallets', label: 'Wallets', icon: Wallet, end: false },
  { to: '/holdings', label: 'Holdings', icon: Briefcase, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, end: true },
  { to: '/transactions', label: 'Trades', icon: ArrowRightLeft, end: true },
];

export function BottomTabBar() {
  return (
    <div className="bottom-tab-bar" role="navigation" aria-label="Mobile navigation">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `btab${isActive ? ' active' : ''}`}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={1.6} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
}
