'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { api } from '@/lib/api';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Eye,
  Glasses,
  Calendar,
  ArrowUpRight,
  Clock,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import { DashboardStats, Order } from '@/lib/types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dueOrders, setDueOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('week');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, dueRes, chartRes] = await Promise.all([
        api.getDashboardStats(),
        api.getOrdersDue(),
        api.getRevenueChart(period),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (dueRes.success && dueRes.data) {
        setDueOrders(dueRes.data);
      }
      if (chartRes.success && chartRes.data) {
        setChartData(chartRes.data.sales || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Welcome & Action Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('Optical Shop Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            {t('Real-time overview of store sales, clinical eye tests, and pending optical jobs.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/customers" className="btn btn-secondary btn-sm">
            <UserPlus size={15} />
            <span>{t('Add Customer')}</span>
          </Link>
          <Link href="/orders/new" className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>{t('New POS Order')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t("Today's Sales")}</span>
            <div className="kpi-value">₹{Number(stats?.today_sales || 0).toLocaleString()}</div>
            <div className="kpi-sub">
              {stats?.today_orders_count || 0} {t('orders booked today')}
            </div>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)' }}>
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t('Active Lab & Pending Jobs')}</span>
            <div className="kpi-value">{stats?.pending_orders || 0}</div>
            <div className="kpi-sub">{t('Orders in processing or fitting')}</div>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t("Today's Eye Tests")}</span>
            <div className="kpi-value">{stats?.today_eye_tests || 0}</div>
            <div className="kpi-sub">{t('Clinical refractions conducted')}</div>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Eye size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t('Total Inventory Stock')}</span>
            <div className="kpi-value">{stats?.total_inventory || 0}</div>
            <div className="kpi-sub">{stats?.active_customers || 0} {t('registered customers')}</div>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <Glasses size={22} />
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Revenue Performance Chart Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('Sales & Revenue Trend')}</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['week', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setPeriod(p)}
                >
                  {t(p)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                {t('No sales data recorded for this period yet.')}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingTop: '20px' }}>
                {chartData.map((d, idx) => {
                  const maxVal = Math.max(...chartData.map((c) => Number(c.total_sales || 0)), 100);
                  const heightPercent = Math.round((Number(d.total_sales || 0) / maxVal) * 100);
                  const dateLabel = new Date(d.sale_date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-hover)', marginBottom: '4px' }}>
                        ₹{Number(d.total_sales)}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '36px',
                          height: `${Math.max(heightPercent, 8)}%`,
                          background: 'var(--primary-gradient)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Deliveries Due Today Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" />
              <h3 className="card-title">{t('Orders Due for Delivery Today')}</h3>
            </div>
            <Link href="/orders" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
              {t('View All')} <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {dueOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                {t('No spectacles or optical orders scheduled for delivery today.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dueOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{o.order_number}</span>
                        <span className={`badge badge-${o.status}`}>{t(o.status)}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {o.first_name} {o.last_name || ''} • {o.customer_phone}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-hover)' }}>
                        ₹{Number(o.grand_total).toFixed(2)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: Number(o.balance_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {Number(o.balance_due) > 0 ? `Due: ₹${Number(o.balance_due).toFixed(2)}` : 'Fully Paid'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>
          {t('Quick Management Shortcuts')}
        </h3>
        <div className="grid-cols-4">
          <Link
            href="/orders/new"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--bg-muted)',
            }}
          >
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('POS Billing')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('Generate bill & Rx')}</p>
            </div>
          </Link>

          <Link
            href="/eye-tests"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--bg-muted)',
            }}
          >
            <div style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <Eye size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('Eye Examination')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('Prescription records')}</p>
            </div>
          </Link>

          <Link
            href="/products"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--bg-muted)',
            }}
          >
            <div style={{ backgroundColor: 'var(--purple-bg)', color: 'var(--purple)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <Glasses size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('Inventory & Frames')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('Manage stock & lenses')}</p>
            </div>
          </Link>

          <Link
            href="/reports"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--bg-muted)',
            }}
          >
            <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <IndianRupee size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('GST Reports')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('Tax & sales summary')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
