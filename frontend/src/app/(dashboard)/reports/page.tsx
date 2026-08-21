'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { api } from '@/lib/api';
import {
  BarChart3,
  IndianRupee,
  FileSpreadsheet,
  Package,
  CreditCard,
  Printer,
} from 'lucide-react';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [gstReport, setGstReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [from, setFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [to, setTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReports();
  }, [from, to]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [gstRes, topRes, valRes, payRes] = await Promise.all([
        api.getGSTReport(from, to),
        api.getTopProducts(),
        api.getStockValuation(),
        api.getPaymentModes(),
      ]);

      if (gstRes.success && gstRes.data) setGstReport(gstRes.data);
      if (topRes.success && topRes.data) setTopProducts(topRes.data || []);
      if (valRes.success && valRes.data) setValuation(valRes.data);
      if (payRes.success && payRes.data) setPaymentModes(payRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header & Date Range */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('Store Reports & GST Analytics')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Generate tax filing summaries, inventory stock valuation, and revenue channel metrics.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('Period')}:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px' }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>-</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px' }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={15} /> {t('Print Report')}
          </button>
        </div>
      </div>

      {/* GST Tax Summary Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="var(--primary)" />
            {t('GST Tax Filing Summary')} ({from} {t('to')} {to})
          </h3>
        </div>

        <div className="grid-cols-4" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('Gross Sales (Total)')}</span>
            <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-hover)' }}>
              ₹{Number(gstReport?.total_gross_sales || 0).toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('Taxable Turnover')}</span>
            <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>
              ₹{Number(gstReport?.total_taxable || 0).toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('CGST Collected')}</span>
            <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--info)' }}>
              ₹{Number(gstReport?.total_cgst || 0).toFixed(2)}
            </p>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('SGST Collected')}</span>
            <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--info)' }}>
              ₹{Number(gstReport?.total_sgst || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Valuation & Payment Modes Grid */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Stock Valuation Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--primary)" />
              {t('Inventory Stock Valuation')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('Total Products Count')}:</span>
              <strong style={{ fontSize: '1rem' }}>{valuation?.total_products_count || 0} items</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('Total Physical Stock Quantity')}:</span>
              <strong style={{ fontSize: '1rem' }}>{valuation?.total_stock_units || 0} units</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('Total Purchase Cost Asset Value')}:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--info)' }}>₹{Number(valuation?.total_cost_value || 0).toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--primary-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
              <span style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>{t('Total Retail Selling Value')}:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--primary-hover)' }}>₹{Number(valuation?.total_retail_value || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--primary)" />
              {t('Payment Mode Collections')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {paymentModes.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                {t('No payment collections recorded in this period.')}
              </p>
            ) : (
              paymentModes.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <strong style={{ textTransform: 'capitalize' }}>{m.payment_mode}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {m.transaction_count} {t('transactions')}
                    </p>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary-hover)' }}>
                    ₹{Number(m.total_amount).toLocaleString()}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '14px' }}>
          {t('Top Performing Optical Products & Lenses (Last 30 Days)')}
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('Product Name')}</th>
                <th>{t('Category')}</th>
                <th style={{ textAlign: 'center' }}>{t('Units Sold')}</th>
                <th style={{ textAlign: 'right' }}>{t('Revenue Generated')}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                    {t('No sales activity recorded in the last 30 days.')}
                  </td>
                </tr>
              ) : (
                topProducts.map((tp, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{tp.product_name}</strong></td>
                    <td><span style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{tp.item_type}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{tp.total_quantity_sold}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-hover)' }}>
                      ₹{Number(tp.total_revenue).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
