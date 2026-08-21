'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Plus,
  ShoppingBag,
  Menu,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const handleOpenMore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open_mobile_nav'));
  };

  const isMoreActive =
    pathname.startsWith('/repairs') ||
    pathname.startsWith('/eye-tests') ||
    pathname.startsWith('/expenses') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/purchases') ||
    pathname.startsWith('/settings');

  return (
    <nav className="bottom-nav">
      <Link
        href="/dashboard"
        className={`bottom-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </Link>

      <Link
        href="/customers"
        className={`bottom-nav-item ${pathname.startsWith('/customers') ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>Customers</span>
      </Link>

      {/* Floating Action Button in Center */}
      <Link href="/orders/new" className="bottom-nav-item bottom-nav-item-fab" title="Create POS Order">
        <Plus size={24} />
      </Link>

      <Link
        href="/orders"
        className={`bottom-nav-item ${pathname.startsWith('/orders') && pathname !== '/orders/new' ? 'active' : ''}`}
      >
        <ShoppingBag size={20} />
        <span>Orders</span>
      </Link>

      {/* Full Features Drawer Trigger */}
      <button
        type="button"
        onClick={handleOpenMore}
        className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        title="All Features & More"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
