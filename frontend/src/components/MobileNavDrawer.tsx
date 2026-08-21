'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import {
  X,
  LayoutDashboard,
  Users,
  ShoppingBag,
  PlusCircle,
  Wrench,
  Eye,
  Glasses,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { Shop, User } from '../lib/types';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop | null;
  user: User | null;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  shop,
  user,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Close drawer on path change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('optisuite_token');
    localStorage.removeItem('optisuite_user');
    onClose();
    router.push('/login');
  };

  if (!isOpen) return null;

  const NAV_SECTIONS = [
    {
      title: 'Main & POS',
      items: [
        { href: '/dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
        { href: '/orders/new', label: 'New Optical Order', icon: PlusCircle, badge: 'New' },
        { href: '/orders', label: 'POS & Orders', icon: ShoppingBag },
        { href: '/customers', label: 'Customers Directory', icon: Users },
      ],
    },
    {
      title: 'Clinical & Services',
      items: [
        { href: '/repairs', label: 'Repairing & Lens Replacement', icon: Wrench },
        { href: '/eye-tests', label: 'Clinical Eye Tests & Prescriptions', icon: Eye },
      ],
    },
    {
      title: 'Store & Inventory',
      items: [
        { href: '/products', label: 'Inventory & Frames', icon: Glasses },
        { href: '/purchases', label: 'Purchases & Vendors', icon: Truck },
        { href: '/expenses', label: 'Store Expense Tracker', icon: Receipt },
        { href: '/reports', label: 'Store Reports & GST Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { href: '/settings', label: 'Shop Settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div
        className="mobile-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <div className="brand-logo" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
              <Glasses size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {shop?.name || 'OptiSuite'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Optical Store Management
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close Navigation Menu"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card if logged in */}
        {user && (
          <div className="mobile-drawer-user">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user.full_name?.charAt(0).toUpperCase() || <UserIcon size={18} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role} {shop?.city ? `• ${shop.city}` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="mobile-drawer-body">
          {NAV_SECTIONS.map((sec, sIdx) => (
            <div key={sIdx} className="mobile-drawer-section">
              <span className="mobile-drawer-section-title">{sec.title}</span>
              <div className="mobile-drawer-links">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
                    >
                      <div className="mobile-drawer-link-left">
                        <div className={`mobile-drawer-icon-wrap ${isActive ? 'active' : ''}`}>
                          <Icon size={18} />
                        </div>
                        <span className="mobile-drawer-label">{item.label}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.badge && (
                          <span className="badge badge-ready" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={15} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer Actions */}
        <div className="mobile-drawer-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger-border, #fca5a5)' }}
          >
            <LogOut size={16} />
            <span>Log Out of Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
