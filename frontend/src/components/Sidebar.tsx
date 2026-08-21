'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Eye,
  Glasses,
  ShoppingBag,
  Wrench,
  Truck,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/orders', label: 'POS & Orders', icon: ShoppingBag },
    { href: '/repairs', label: 'Repairs & Services', icon: Wrench },
    { href: '/eye-tests', label: 'Eye Tests (Rx)', icon: Eye },
    { href: '/products', label: 'Inventory', icon: Glasses },
    { href: '/purchases', label: 'Purchases & Vendors', icon: Truck },
    { href: '/expenses', label: 'Expense Tracker', icon: Receipt },
    { href: '/reports', label: 'Sales & GST Reports', icon: BarChart3 },
    { href: '/settings', label: 'Shop Settings', icon: Settings },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <Glasses size={20} />
        </div>
        <div>
          <h2 className="brand-title">OptiSuite</h2>
          <span className="brand-sub">Optical Suite</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
