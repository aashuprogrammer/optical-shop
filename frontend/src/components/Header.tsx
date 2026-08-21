'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MobileNavDrawer } from './MobileNavDrawer';
import { api } from '../lib/api';
import {
  PlusCircle,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
} from 'lucide-react';
import { Shop, User } from '../lib/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const loadUserData = () => {
    const storedUser = localStorage.getItem('optisuite_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadUserData();

    api.getShop().then((res) => {
      if (res.success && res.data) {
        setShop(res.data);
      }
    });

    api.me().then((res) => {
      if (res.success && res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('optisuite_user', JSON.stringify(res.data.user));
      }
    });

    // Listen for custom user profile updates
    const handleProfileUpdate = () => loadUserData();
    const handleOpenMobileMenu = () => setIsMobileDrawerOpen(true);

    window.addEventListener('user_profile_updated', handleProfileUpdate);
    window.addEventListener('auth_user_updated', handleProfileUpdate);
    window.addEventListener('open_mobile_nav', handleOpenMobileMenu);

    return () => {
      window.removeEventListener('user_profile_updated', handleProfileUpdate);
      window.removeEventListener('auth_user_updated', handleProfileUpdate);
      window.removeEventListener('open_mobile_nav', handleOpenMobileMenu);
    };
  }, []);

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('optisuite_token');
    localStorage.removeItem('optisuite_user');
    router.push('/login');
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            className="btn-icon mobile-menu-toggle"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open Full Navigation Menu"
            title="All Features & Navigation"
          >
            <Menu size={20} />
          </button>

          <div className="shop-badge">
            <Sparkles size={18} className="shop-sparkle-icon" />
            <span className="shop-name-text">{shop?.name || 'OptiSuite'}</span>
          </div>
        </div>

        <div className="header-right">
          {/* New POS Order Quick Action */}
          <Link href="/orders/new" className="btn btn-primary btn-sm header-order-btn">
            <PlusCircle size={15} />
            <span>New Order</span>
          </Link>

          {/* User Profile Avatar & Logout */}
          <div className="header-user-wrapper">
            <Link
              href="/settings"
              title={user ? `${user.full_name} (${user.role}) - Click for Settings` : 'Shop Settings'}
              className="header-avatar"
            >
              {user?.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.full_name || 'User Profile'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : user?.full_name ? (
                <span>{user.full_name.charAt(0).toUpperCase()}</span>
              ) : (
                <UserIcon size={16} />
              )}
            </Link>
            <button className="btn-icon header-logout-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} color="var(--danger)" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        shop={shop}
        user={user}
      />
    </>
  );
};
