'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/TranslationContext';
import { Printer, Download, ArrowLeft, Stethoscope, Building2 } from 'lucide-react';
import { Order, OrderItem, OrderPrescription, Shop } from '../lib/types';

interface InvoiceViewProps {
  order: Order;
  items: OrderItem[];
  prescription?: OrderPrescription | null;
  shop?: Shop | null;
  onBack?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  order,
  items,
  prescription,
  shop,
  onBack,
}) => {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const currency = shop?.currency_symbol || '₹';

  const formatPowerDisplay = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num === 0) return '+0.00';
    return (num > 0 ? '+' : '') + num.toFixed(2);
  };

  return (
    <div>
      {/* Top Action Bar (hidden on print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-card)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {onBack ? (
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> {t('Back to Order')}
          </button>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} title={t('Download PDF format')}>
            <Download size={16} /> {t('Download PDF')}
          </button>
          <button className="btn btn-primary" onClick={handlePrint} title={t('Print receipt or invoice')}>
            <Printer size={16} /> {t('Print Invoice')}
          </button>
        </div>
      </div>

      {/* Invoice Document Layout */}
      <div className="invoice-card" id="printable-invoice">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-hover)' }}>
              {shop?.name || 'OptiSuite Optical Shop'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {shop?.address_line1} {shop?.address_line2 ? `, ${shop.address_line2}` : ''}
              {shop?.city ? `, ${shop.city}` : ''} {shop?.state ? ` - ${shop.state}` : ''} {shop?.pin_code}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('Phone')}: {shop?.phone || 'N/A'} | {t('Email')}: {shop?.email || 'N/A'}
            </p>
            {shop?.gstin && (
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                GSTIN: {shop.gstin}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-hover)',
              }}
            >
              {t('Tax Invoice / Optical Prescription')}
            </span>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
              #{order.order_number}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('Date')}: {new Date(order.created_at).toLocaleDateString()}
            </p>
            {order.expected_delivery && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('Delivery Due')}: {new Date(order.expected_delivery).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Customer & Checkup Info */}
        <div className="invoice-meta-grid" style={{ marginBottom: '18px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {t('Customer Details')}
            </h4>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {order.first_name} {order.last_name || ''}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('Phone')}: {order.customer_phone || 'N/A'}
            </p>
            {order.customer_city && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('City')}: {order.customer_city}
              </p>
            )}
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {t('Eye Examination & Specialist')}
            </h4>
            {prescription?.checkup_by_type === 'dr' ? (
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                  👨‍⚕️ {prescription.doctor_name || t('Doctor Prescription')}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {prescription.hospital_name ? `${prescription.hospital_name}` : ''}
                  {prescription.doctor_city ? ` (${prescription.doctor_city})` : ''}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                  👓 {prescription?.examiner_name || shop?.optometrist_name || 'OptiSuite Examiner'}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {prescription?.optical_shop_name || shop?.name || 'OptiSuite'}
                  {prescription?.optical_city ? ` (${prescription.optical_city})` : ''}
                </p>
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <strong>{t('Payment Status')}:</strong> <span style={{ textTransform: 'capitalize' }}>{order.payment_status}</span>
            </p>
          </div>
        </div>

        {/* Prescription Table (if exists) */}
        {prescription && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-hover)', margin: 0 }}>
                {t('Prescription Matrix (Refraction Data)')}
              </h3>
              {prescription.total_pd && Number(prescription.total_pd) > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {t('Total PD')}: {prescription.total_pd} mm
                </span>
              )}
            </div>
            <table className="rx-table">
              <thead>
                <tr>
                  <th>{t('Eye')}</th>
                  <th>{t('SPH')}</th>
                  <th>{t('CYL')}</th>
                  <th>{t('AXIS')}</th>
                  <th>{t('V.A.')}</th>
                  <th>{t('ADD')}</th>
                  <th>{t('PD (mm)')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="eye-label">{t('OD (Right)')}</td>
                  <td style={{ fontWeight: 700 }}>{formatPowerDisplay(prescription.re_sph)}</td>
                  <td style={{ fontWeight: 700 }}>{formatPowerDisplay(prescription.re_cyl)}</td>
                  <td>{prescription.re_axis ? `${prescription.re_axis}°` : '-'}</td>
                  <td>{prescription.re_visual_acuity || '6/6'}</td>
                  <td>{prescription.re_add ? formatPowerDisplay(prescription.re_add) : '-'}</td>
                  <td>{prescription.re_pd || '-'}</td>
                </tr>
                <tr>
                  <td className="eye-label">{t('OS (Left)')}</td>
                  <td style={{ fontWeight: 700 }}>{formatPowerDisplay(prescription.le_sph)}</td>
                  <td style={{ fontWeight: 700 }}>{formatPowerDisplay(prescription.le_cyl)}</td>
                  <td>{prescription.le_axis ? `${prescription.le_axis}°` : '-'}</td>
                  <td>{prescription.le_visual_acuity || '6/6'}</td>
                  <td>{prescription.le_add ? formatPowerDisplay(prescription.le_add) : '-'}</td>
                  <td>{prescription.le_pd || '-'}</td>
                </tr>
              </tbody>
            </table>

            {(prescription.lens_type || prescription.lens_for || prescription.lens_company || prescription.lens_product) && (
              <div
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '6px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {prescription.lens_for && (
                  <span><strong>{t('Lens For')}:</strong> {prescription.lens_for}</span>
                )}
                {prescription.lens_type && (
                  <span><strong>{t('Lens Type')}:</strong> {prescription.lens_type}</span>
                )}
                {prescription.lens_company && (
                  <span><strong>{t('Brand')}:</strong> {prescription.lens_company} {prescription.lens_product || ''}</span>
                )}
                {prescription.lens_index && (
                  <span><strong>{t('Index')}:</strong> {prescription.lens_index}</span>
                )}
                {prescription.lens_dia && (
                  <span><strong>{t('Dia')}:</strong> {prescription.lens_dia} mm</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Itemized Bill Table */}
        <div style={{ marginBottom: '20px' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('Description / Item')}</th>
                <th>{t('HSN')}</th>
                <th style={{ textAlign: 'center' }}>{t('Qty')}</th>
                <th style={{ textAlign: 'right' }}>{t('Unit Price')}</th>
                <th style={{ textAlign: 'right' }}>{t('Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</p>}
                  </td>
                  <td>{item.hsn_code || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{currency}{Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{currency}{Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('Subtotal')}:</span>
              <span>{currency}{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--danger)' }}>
                <span>{t('Discount')}:</span>
                <span>-{currency}{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: 800,
                borderTop: '1px solid var(--border)',
                paddingTop: '8px',
                marginTop: '4px',
                color: 'var(--primary-hover)',
              }}
            >
              <span>{t('Grand Total')}:</span>
              <span>{currency}{Number(order.grand_total).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
              <span>{t('Amount Paid')}:</span>
              <span>{currency}{Number(order.amount_paid).toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                color: Number(order.balance_due) > 0 ? 'var(--danger)' : 'var(--success)',
                fontWeight: 700,
              }}
            >
              <span>{t('Balance Due')}:</span>
              <span>{currency}{Number(order.balance_due).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms & Signature */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '60%' }}>
            <h5 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('Terms & Conditions')}:</h5>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
              {shop?.terms_and_conditions ||
                '1. Goods once sold will not be taken back.\n2. Warranty covers manufacturing defects only on frames/coatings.\n3. Please inspect power and fitting at the time of delivery.'}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '40px' }} />
            <div style={{ borderTop: '1px solid var(--text-subtle)', width: '140px', paddingTop: '4px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('Authorized Signatory')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
