'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n/TranslationContext';
import {
  LayoutDashboard,
  Users,
  Plus,
  Glasses,
  ShoppingBag,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav">
      <Link
        href="/dashboard"
        className={`bottom-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>{t('Home')}</span>
      </Link>

      <Link
        href="/customers"
        className={`bottom-nav-item ${pathname.startsWith('/customers') ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>{t('Customers')}</span>
      </Link>

      {/* Floating Action Button in Center */}
      <Link href="/orders/new" className="bottom-nav-item bottom-nav-item-fab" title={t('Create POS Order')}>
        <Plus size={24} />
      </Link>

      <Link
        href="/orders"
        className={`bottom-nav-item ${pathname.startsWith('/orders') && pathname !== '/orders/new' ? 'active' : ''}`}
      >
        <ShoppingBag size={20} />
        <span>{t('Orders')}</span>
      </Link>

      <Link
        href="/products"
        className={`bottom-nav-item ${pathname.startsWith('/products') ? 'active' : ''}`}
      >
        <Glasses size={20} />
        <span>{t('Inventory')}</span>
      </Link>
    </nav>
  );
};
