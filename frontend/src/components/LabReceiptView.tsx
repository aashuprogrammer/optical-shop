'use client';

import React from 'react';
import { Printer, Download, ArrowLeft, Building2, Stethoscope, Eye, User, Phone, MapPin, Calendar, Hash, FileText } from 'lucide-react';
import { Order, OrderItem, OrderPrescription, Shop } from '../lib/types';

interface LabReceiptViewProps {
  order: Order;
  items?: OrderItem[];
  prescription?: OrderPrescription | null;
  shop?: Shop | null;
  onBack?: () => void;
}

export const LabReceiptView: React.FC<LabReceiptViewProps> = ({
  order,
  items = [],
  prescription,
  shop,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const formatPower = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '-';
    if (num === 0) return '0.00';
    return (num > 0 ? '+' : '') + num.toFixed(2);
  };

  const calculateAge = (dobStr?: string, ageVal?: string | number): string => {
    if (ageVal) return `${ageVal} yrs`;
    if (!dobStr) return '-';
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : '-';
  };

  // Calculate Reading (Near) SPH: SPH + ADD
  const getReadingSph = (sph: string | number | undefined, add: string | number | undefined) => {
    const s = typeof sph === 'string' ? parseFloat(sph) || 0 : sph || 0;
    const a = typeof add === 'string' ? parseFloat(add) || 0 : add || 0;
    if (a === 0 && s === 0) return '-';
    if (a !== 0) {
      return formatPower(s + a);
    }
    return formatPower(s);
  };

  // Extract Frame and Lens details from items
  const frameItems = items.filter(
    (i) => i.item_type === 'frame' || i.item_type === 'full_specs_frame' || i.item_type === 'spectacles'
  );
  const lensItems = items.filter(
    (i) => i.item_type === 'lens' || i.item_type === 'full_specs_lens'
  );

  const primaryFrame = frameItems[0];
  const primaryLens = lensItems[0];

  const frameCompany =
    primaryFrame?.details?.frame_company ||
    primaryFrame?.details?.company ||
    primaryFrame?.description?.split('|')[0]?.trim() ||
    '-';

  const frameType =
    primaryFrame?.details?.frame_type ||
    prescription?.lens_material ||
    '-';

  const frameModel =
    primaryFrame?.name ||
    primaryFrame?.details?.model ||
    '-';

  const lensCompany =
    primaryLens?.details?.company ||
    prescription?.lens_company ||
    '-';

  const lensType =
    prescription?.lens_type ||
    primaryLens?.details?.lens_type ||
    '-';

  const lensProduct =
    prescription?.lens_product ||
    primaryLens?.details?.product ||
    primaryLens?.name ||
    '-';

  const lensIndex =
    prescription?.lens_index ||
    primaryLens?.details?.index ||
    '1.56';

  const lensDia =
    prescription?.lens_dia ||
    primaryLens?.details?.dia ||
    '70';

  const lensFor =
    prescription?.lens_for ||
    primaryLens?.details?.lens_for ||
    'DISTANCE';

  // Examiner / Optometrist Name
  const examinerName =
    prescription?.examiner_name ||
    prescription?.doctor_name ||
    shop?.optometrist_name ||
    'Consulting Optometrist';

  // Shop Owner / Business Name
  const shopOwnerName = shop?.name || 'Optical Store';

  // Customer Full Address
  const customerAddress =
    order.customer_address ||
    order.customer_city ||
    'N/A';

  // Customer Phone
  const customerPhone = order.customer_phone || 'N/A';

  // Serial / Order Number
  const serialNo = order.order_number || `ORD-${order.id}`;

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
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {onBack ? (
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} title="Download PDF format">
            <Download size={16} /> Download PDF
          </button>
          <button className="btn btn-primary" onClick={handlePrint} title="Print Lab Receipt">
            <Printer size={16} /> Print Lab Receipt
          </button>
        </div>
      </div>

      {/* Lab Work Receipt Printable Document */}
      <div
        className="invoice-card lab-receipt-card"
        id="printable-lab-receipt"
        style={{
          backgroundColor: '#ffffff',
          color: '#111827',
          padding: '28px',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid #374151',
          maxWidth: '820px',
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Document Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #111827',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#111827',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              EXTERNAL LAB ORDER & JOB SLIP
            </span>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              {shopOwnerName}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f3f4f6',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
              }}
            >
              <Hash size={16} color="#111827" />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                S. No: {serialNo}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: '6px 0 0 0', fontWeight: 600 }}>
              Date: {new Date(order.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 1. Shop Details & 2. Customer Details Two-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            backgroundColor: '#f9fafb',
            padding: '14px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px',
          }}
        >
          {/* Shop Details */}
          <div>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Shop Details
            </h4>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Shop / Owner:</strong> {shopOwnerName}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Address:</strong> {shop?.address_line1} {shop?.city ? `, ${shop.city}` : ''} {shop?.state ? ` - ${shop.state}` : ''} {shop?.pin_code}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Phone:</strong> {shop?.phone || 'N/A'}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Optometrist / Dr:</strong> {examinerName}
            </p>
          </div>

          {/* Customer Details */}
          <div>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Customer Details
            </h4>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>S. No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{serialNo}</span>
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Customer Name:</strong> {order.first_name} {order.last_name || ''}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Age / Gender:</strong> {calculateAge(order.customer_dob, order.customer_age)} &nbsp;|&nbsp; {order.customer_gender ? order.customer_gender.toUpperCase() : 'N/A'}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Phone:</strong> {customerPhone}
            </p>
            <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>
              <strong>Address:</strong> {customerAddress}
            </p>
          </div>
        </div>

        {/* 3. Eye Prescription Section (OD & OS x Distance & Reading) */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Eye Prescription (Rx)
            </h3>
            {prescription?.lens_for && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #bae6fd',
                }}
              >
                Lens For: {lensFor}
              </span>
            )}
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '2px solid #111827',
              textAlign: 'center',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                <th style={{ padding: '8px 10px', border: '1px solid #374151', width: '90px' }}>Type</th>
                <th colSpan={4} style={{ padding: '8px 10px', border: '1px solid #374151', backgroundColor: '#1e293b' }}>
                  RIGHT EYE (OD)
                </th>
                <th colSpan={4} style={{ padding: '8px 10px', border: '1px solid #374151', backgroundColor: '#334155' }}>
                  LEFT EYE (OS)
                </th>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6', color: '#111827', fontWeight: 700, fontSize: '0.8rem' }}>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Row</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>SPH</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>CYL</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Axis</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Vision</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>SPH</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>CYL</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Axis</th>
                <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Vision</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Distance */}
              <tr style={{ backgroundColor: '#ffffff', fontWeight: 600 }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontWeight: 700 }}>
                  Distance
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.re_sph)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.re_cyl)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {prescription?.re_axis ? `${prescription.re_axis}°` : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {prescription?.re_visual_acuity || '6/6'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.le_sph)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.le_cyl)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {prescription?.le_axis ? `${prescription.le_axis}°` : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {prescription?.le_visual_acuity || '6/6'}
                </td>
              </tr>

              {/* Row 2: Reading */}
              <tr style={{ backgroundColor: '#ffffff', fontWeight: 600 }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontWeight: 700 }}>
                  Reading
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f766e' }}>
                  {getReadingSph(prescription?.re_sph, prescription?.re_add)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.re_cyl)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {prescription?.re_axis ? `${prescription.re_axis}°` : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {prescription?.re_add ? 'N/6' : (prescription?.re_visual_acuity || 'Near')}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f766e' }}>
                  {getReadingSph(prescription?.le_sph, prescription?.le_add)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatPower(prescription?.le_cyl)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {prescription?.le_axis ? `${prescription.le_axis}°` : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {prescription?.le_add ? 'N/6' : (prescription?.le_visual_acuity || 'Near')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pupillary Distance & Addition Summary */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'space-between',
              backgroundColor: '#f3f4f6',
              padding: '8px 14px',
              border: '1px solid #d1d5db',
              borderTop: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              flexWrap: 'wrap',
            }}
          >
            <span>OD (Right) ADD: <strong>{formatPower(prescription?.re_add)}</strong></span>
            <span>OS (Left) ADD: <strong>{formatPower(prescription?.le_add)}</strong></span>
            <span>OD PD: <strong>{prescription?.re_pd ? `${prescription.re_pd} mm` : '-'}</strong></span>
            <span>OS PD: <strong>{prescription?.le_pd ? `${prescription.le_pd} mm` : '-'}</strong></span>
            <span>Total PD: <strong>{prescription?.total_pd ? `${prescription.total_pd} mm` : '-'}</strong></span>
          </div>
        </div>

        {/* 4. Remarks Section at the Bottom */}
        <div
          style={{
            border: '2px dashed #9ca3af',
            borderRadius: '6px',
            padding: '14px 16px',
            backgroundColor: '#fffbeb',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={16} color="#92400e" />
            <strong style={{ fontSize: '0.88rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Remark (Lab Instructions / Special Notes)
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', minHeight: '36px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {prescription?.notes || order.notes || 'No special remarks.'}
          </p>
        </div>

        {/* Footer & Signatures */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #d1d5db',
            paddingTop: '16px',
            marginTop: '20px',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
            <p style={{ margin: '2px 0' }}>Expected Delivery: <strong>{order.expected_delivery || 'Standard (2-3 days)'}</strong></p>
            <p style={{ margin: '2px 0' }}>Generated by OptiSuite Optical System</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ borderBottom: '1px solid #111827', width: '100%', height: '32px', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
