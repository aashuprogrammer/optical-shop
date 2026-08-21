'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderStepper } from '@/components/OrderStepper';
import { InvoiceView } from '@/components/InvoiceView';
import { LabReceiptView } from '@/components/LabReceiptView';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import {
  FileText,
  Printer,
  CreditCard,
  Ban,
  ArrowLeft,
  Edit,
  Save,
  Glasses,
  Eye,
} from 'lucide-react';
import { Order, OrderItem, OrderPayment, OrderPrescription, OrderStatusHistory, Shop } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [prescription, setPrescription] = useState<OrderPrescription | null>(null);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'invoice' | 'lab_receipt'>('details');
  const [loading, setLoading] = useState<boolean>(true);

  // Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('cash');
  const [payRef, setPayRef] = useState<string>('');

  // Status Modal
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');

  // Edit Order Modal
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editTab, setEditTab] = useState<'prescription' | 'specs' | 'order'>('prescription');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    // Rx
    re_sph: 0,
    re_cyl: 0,
    re_axis: 0,
    re_add: 0,
    re_pd: 31.5,
    re_va: '6/6',
    le_sph: 0,
    le_cyl: 0,
    le_axis: 0,
    le_add: 0,
    le_pd: 31.5,
    le_va: '6/6',
    total_pd: 63.0,
    lens_for: 'DISTANCE',
    lens_type: 'PLASTIC LENS',
    lens_company: '',
    lens_product: '',
    lens_index: '1.56',
    lens_dia: '70',
    rx_notes: '',
    // Full Specs Frame
    frame_company: '',
    frame_model: '',
    frame_type: 'FULL SHELL/PLASTIC',
    frame_price: 0,
    lens_price: 0,
    // Order info
    discount_type: 'flat',
    discount_value: 0,
    expected_delivery: '',
    notes: '',
  });

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getOrder(orderId);
      if (res.success && res.data) {
        setOrder(res.data.order);
        setItems(res.data.items || []);
        setPrescription(res.data.prescription);
        setPayments(res.data.payments || []);
        setHistory(res.data.history || []);
        setShop(res.data.shop);
        setNewStatus(res.data.order?.status || 'pending');
        setPayAmount(Number(res.data.order?.balance_due || 0));
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    const primaryFrame = items.find(
      (i) => i.item_type === 'full_specs_frame' || i.item_type === 'frame'
    );
    const primaryLens = items.find(
      (i) => i.item_type === 'full_specs_lens' || i.item_type === 'lens'
    );

    setEditForm({
      re_sph: Number(prescription?.re_sph) || 0,
      re_cyl: Number(prescription?.re_cyl) || 0,
      re_axis: Number(prescription?.re_axis) || 0,
      re_add: Number(prescription?.re_add) || 0,
      re_pd: Number(prescription?.re_pd) || 31.5,
      re_va: prescription?.re_visual_acuity || '6/6',
      le_sph: Number(prescription?.le_sph) || 0,
      le_cyl: Number(prescription?.le_cyl) || 0,
      le_axis: Number(prescription?.le_axis) || 0,
      le_add: Number(prescription?.le_add) || 0,
      le_pd: Number(prescription?.le_pd) || 31.5,
      le_va: prescription?.le_visual_acuity || '6/6',
      total_pd: Number(prescription?.total_pd) || 63,
      lens_for: prescription?.lens_for || primaryLens?.details?.lens_for || 'DISTANCE',
      lens_type: prescription?.lens_type || primaryLens?.details?.lens_type || 'PLASTIC LENS',
      lens_company: prescription?.lens_company || primaryLens?.details?.company || '',
      lens_product: prescription?.lens_product || primaryLens?.details?.product || '',
      lens_index: prescription?.lens_index || primaryLens?.details?.index || '1.56',
      lens_dia: prescription?.lens_dia || primaryLens?.details?.dia || '70',
      rx_notes: prescription?.notes || order?.notes || '',
      frame_company: primaryFrame?.details?.frame_company || primaryFrame?.details?.company || '',
      frame_model: primaryFrame?.name || primaryFrame?.details?.model || '',
      frame_type: primaryFrame?.details?.frame_type || 'FULL SHELL/PLASTIC',
      frame_price: Number(primaryFrame?.unit_price) || 0,
      lens_price: Number(primaryLens?.unit_price) || 0,
      discount_type: order?.discount_type || 'flat',
      discount_value: Number(order?.discount_value) || 0,
      expected_delivery: order?.expected_delivery
        ? new Date(order.expected_delivery).toISOString().split('T')[0]
        : '',
      notes: order?.notes || '',
    });
    setEditTab('prescription');
    setIsEditOpen(true);
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);

    try {
      const updatedItems = [
        {
          product_id: null,
          item_type: 'full_specs_frame',
          name: editForm.frame_model || `${editForm.frame_company || 'Custom'} Frame`,
          description: `${editForm.frame_company || 'Standard'} | ${editForm.frame_type}`,
          quantity: 1,
          unit_price: Number(editForm.frame_price) || 0,
          discount_amount: 0,
          tax_rate: 0,
          hsn_code: '9003',
          details: {
            frame_company: editForm.frame_company,
            frame_type: editForm.frame_type,
            model: editForm.frame_model,
          },
        },
        {
          product_id: null,
          item_type: 'full_specs_lens',
          name: `${editForm.lens_type} (${editForm.lens_for})`,
          description: `${editForm.lens_company} ${editForm.lens_product} | Idx: ${editForm.lens_index} | Dia: ${editForm.lens_dia}`,
          quantity: 1,
          unit_price: Number(editForm.lens_price) || 0,
          discount_amount: 0,
          tax_rate: 0,
          hsn_code: '9001',
          details: {
            lens_for: editForm.lens_for,
            lens_type: editForm.lens_type,
            company: editForm.lens_company,
            product: editForm.lens_product,
            index: editForm.lens_index,
            dia: editForm.lens_dia,
          },
        },
      ];

      const payload = {
        items: updatedItems,
        prescription: {
          re_sph: Number(editForm.re_sph) || 0,
          re_cyl: Number(editForm.re_cyl) || 0,
          re_axis: Number(editForm.re_axis) || 0,
          re_add: Number(editForm.re_add) || 0,
          re_pd: Number(editForm.re_pd) || 31.5,
          re_visual_acuity: editForm.re_va || '6/6',
          le_sph: Number(editForm.le_sph) || 0,
          le_cyl: Number(editForm.le_cyl) || 0,
          le_axis: Number(editForm.le_axis) || 0,
          le_add: Number(editForm.le_add) || 0,
          le_pd: Number(editForm.le_pd) || 31.5,
          le_visual_acuity: editForm.le_va || '6/6',
          total_pd: Number(editForm.total_pd) || 63,
          lens_for: editForm.lens_for,
          lens_type: editForm.lens_type,
          lens_company: editForm.lens_company,
          lens_product: editForm.lens_product,
          lens_index: editForm.lens_index,
          lens_dia: editForm.lens_dia,
          notes: editForm.rx_notes,
        },
        discount_type: editForm.discount_type,
        discount_value: Number(editForm.discount_value) || 0,
        expected_delivery: editForm.expected_delivery,
        notes: editForm.rx_notes || editForm.notes,
      };

      const res = await api.updateOrder(orderId, payload);
      if (res.success) {
        setIsEditOpen(false);
        loadOrderDetail();
      } else {
        alert(res.error || 'Failed to update order');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const res = await api.addOrderPayment(orderId, {
      amount: payAmount,
      payment_mode: payMode,
      transaction_ref: payRef,
    });
    if (res.success) {
      setIsPaymentOpen(false);
      loadOrderDetail();
    } else {
      alert(res.error || 'Failed to record payment');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateOrderStatus(orderId, {
      status: newStatus,
      notes: statusNote,
    });
    if (res.success) {
      setIsStatusOpen(false);
      setStatusNote('');
      loadOrderDetail();
    } else {
      alert(res.error || 'Failed to update order stage');
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm(t('Are you sure you want to cancel this order? This will restore inventory stock.'))) return;
    const res = await api.cancelOrder(orderId);
    if (res.success) {
      loadOrderDetail();
    } else {
      alert(res.error || 'Failed to cancel order');
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        {t('Loading order & invoice records...')}
      </div>
    );
  }

  // Invoice Mode View
  if (viewMode === 'invoice') {
    return (
      <InvoiceView
        order={order}
        items={items}
        prescription={prescription}
        shop={shop}
        onBack={() => setViewMode('details')}
      />
    );
  }

  // External Lab Receipt Mode View
  if (viewMode === 'lab_receipt') {
    return (
      <LabReceiptView
        order={order}
        items={items}
        prescription={prescription}
        shop={shop}
        onBack={() => setViewMode('details')}
      />
    );
  }

  return (
    <div>
      {/* Header & Quick Action Buttons */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/orders')}>
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Order #{order.order_number}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={openEditModal}
            title="Edit Eye Prescription, Frame Specs, or Billing Details"
          >
            <Edit size={16} /> Edit Order
          </button>
          <button className="btn btn-secondary" onClick={() => setViewMode('invoice')} title="View Customer Tax Invoice">
            <FileText size={16} /> Customer Invoice
          </button>
          <button className="btn btn-primary" onClick={() => setViewMode('lab_receipt')} title="Print External Lab Job Slip">
            <Printer size={16} /> Print Lab Receipt
          </button>
        </div>
      </div>

      {/* Visual Job Progression Stepper */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">{t('Optical Job Stage Progression')}</h3>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsStatusOpen(true)}>
              {t('Advance Stage')}
            </button>
          )}
        </div>
        <OrderStepper currentStatus={order.status} />
      </div>

      {/* Main Details Grid */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Customer & Prescription Info */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              {t('Customer & Refraction Details')}
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={openEditModal}>
              <Edit size={13} /> Edit Rx
            </button>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>
              {order.first_name} {order.last_name || ''}
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
              {order.customer_dob && (
                <span>
                  <strong>Age:</strong>{' '}
                  {new Date().getFullYear() - new Date(order.customer_dob).getFullYear()} yrs
                </span>
              )}
              {order.customer_gender && (
                <span style={{ textTransform: 'capitalize' }}>
                  <strong>Gender:</strong> {order.customer_gender}
                </span>
              )}
              <span><strong>Phone:</strong> {order.customer_phone || 'N/A'}</span>
              <span><strong>City:</strong> {order.customer_city || 'N/A'}</span>
            </div>
          </div>

          {prescription ? (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '6px' }}>
                {t('Prescription Matrix')}
              </h4>
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>{t('Eye')}</th>
                    <th>{t('SPH')}</th>
                    <th>{t('CYL')}</th>
                    <th>{t('AXIS')}</th>
                    <th>{t('ADD')}</th>
                    <th>{t('PD')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="eye-label">OD (Right)</td>
                    <td>{prescription.re_sph ? (Number(prescription.re_sph) >= 0 ? `+${Number(prescription.re_sph).toFixed(2)}` : Number(prescription.re_sph).toFixed(2)) : '-'}</td>
                    <td>{prescription.re_cyl ? (Number(prescription.re_cyl) >= 0 ? `+${Number(prescription.re_cyl).toFixed(2)}` : Number(prescription.re_cyl).toFixed(2)) : '-'}</td>
                    <td>{prescription.re_axis ? `${prescription.re_axis}°` : '-'}</td>
                    <td>{prescription.re_add ? `+${Number(prescription.re_add).toFixed(2)}` : '-'}</td>
                    <td>{prescription.re_pd ? `${prescription.re_pd} mm` : '-'}</td>
                  </tr>
                  <tr>
                    <td className="eye-label">OS (Left)</td>
                    <td>{prescription.le_sph ? (Number(prescription.le_sph) >= 0 ? `+${Number(prescription.le_sph).toFixed(2)}` : Number(prescription.le_sph).toFixed(2)) : '-'}</td>
                    <td>{prescription.le_cyl ? (Number(prescription.le_cyl) >= 0 ? `+${Number(prescription.le_cyl).toFixed(2)}` : Number(prescription.le_cyl).toFixed(2)) : '-'}</td>
                    <td>{prescription.le_axis ? `${prescription.le_axis}°` : '-'}</td>
                    <td>{prescription.le_add ? `+${Number(prescription.le_add).toFixed(2)}` : '-'}</td>
                    <td>{prescription.le_pd ? `${prescription.le_pd} mm` : '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {prescription.lens_for && <span><strong>Lens For:</strong> {prescription.lens_for}</span>}
                {prescription.lens_type && <span><strong>Lens Type:</strong> {prescription.lens_type}</span>}
                {prescription.total_pd && <span><strong>Total PD:</strong> {prescription.total_pd} mm</span>}
              </div>

              {prescription.notes && (
                <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase' }}>Remark / Lab Instructions:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#1f2937' }}>{prescription.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('No optical prescription linked to this order.')}</p>
          )}
        </div>

        {/* Financials & Payment Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('Payment & Ledger')}</h3>
            {Number(order.balance_due) > 0 && order.status !== 'cancelled' && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsPaymentOpen(true)}>
                <CreditCard size={14} /> {t('Collect Balance')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('Grand Total')}:</span>
              <span style={{ fontWeight: 700 }}>₹{Number(order.grand_total).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
              <span>{t('Amount Paid')}:</span>
              <span style={{ fontWeight: 700 }}>₹{Number(order.amount_paid).toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: 800,
                borderTop: '1px solid var(--border)',
                paddingTop: '8px',
                color: Number(order.balance_due) > 0 ? 'var(--danger)' : 'var(--success)',
              }}
            >
              <span>{t('Balance Due')}:</span>
              <span>₹{Number(order.balance_due).toFixed(2)}</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
            {t('Payment Transactions Log')}
          </h4>
          <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {payments.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No payment transactions recorded.</p>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.payment_mode}</span>
                    {p.transaction_ref && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({p.transaction_ref})</span>}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{new Date(p.payment_date).toLocaleString()}</p>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>+₹{Number(p.amount).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            {t('Ordered Eyewear & Service Items')}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={openEditModal}>
            <Edit size={13} /> Edit Specs & Items
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('Item Name')}</th>
                <th>{t('Type')}</th>
                <th style={{ textAlign: 'center' }}>{t('Qty')}</th>
                <th style={{ textAlign: 'right' }}>{t('Unit Price')}</th>
                <th style={{ textAlign: 'right' }}>{t('GST Tax')}</th>
                <th style={{ textAlign: 'right' }}>{t('Total Price')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td><span style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{item.item_type}</span></td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{Number(item.tax_rate)}%</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone: Cancel Order */}
      {order.status !== 'cancelled' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-danger btn-sm" onClick={handleCancelOrder}>
            <Ban size={14} /> {t('Cancel Order & Restore Inventory Stock')}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / UPDATE ORDER MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Order Details" maxWidth="750px">
        <form onSubmit={handleSaveOrderEdit}>
          {/* Sub Navigation Tabs */}
          <div className="tabs" style={{ marginBottom: '18px' }}>
            <button
              type="button"
              className={`tab-btn ${editTab === 'prescription' ? 'active' : ''}`}
              onClick={() => setEditTab('prescription')}
            >
              <Eye size={15} /> Eye Prescription (Rx)
            </button>
            <button
              type="button"
              className={`tab-btn ${editTab === 'specs' ? 'active' : ''}`}
              onClick={() => setEditTab('specs')}
            >
              <Glasses size={15} /> Frame & Lens Specs
            </button>
            <button
              type="button"
              className={`tab-btn ${editTab === 'order' ? 'active' : ''}`}
              onClick={() => setEditTab('order')}
            >
              <FileText size={15} /> Billing & Notes
            </button>
          </div>

          {/* TAB 1: EYE PRESCRIPTION */}
          {editTab === 'prescription' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '8px' }}>
                  Right Eye (OD)
                </h4>
                <div className="grid-cols-3" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">SPH Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.re_sph}
                      onChange={(e) => setEditForm({ ...editForm, re_sph: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CYL Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.re_cyl}
                      onChange={(e) => setEditForm({ ...editForm, re_cyl: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Axis (0-180°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      className="form-input"
                      value={editForm.re_axis}
                      onChange={(e) => setEditForm({ ...editForm, re_axis: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ADD Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.re_add}
                      onChange={(e) => setEditForm({ ...editForm, re_add: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visual Acuity</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.re_va}
                      onChange={(e) => setEditForm({ ...editForm, re_va: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">R PD (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={editForm.re_pd}
                      onChange={(e) => {
                        const r = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, re_pd: r, total_pd: r + editForm.le_pd });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '8px' }}>
                  Left Eye (OS)
                </h4>
                <div className="grid-cols-3" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">SPH Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.le_sph}
                      onChange={(e) => setEditForm({ ...editForm, le_sph: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CYL Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.le_cyl}
                      onChange={(e) => setEditForm({ ...editForm, le_cyl: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Axis (0-180°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      className="form-input"
                      value={editForm.le_axis}
                      onChange={(e) => setEditForm({ ...editForm, le_axis: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ADD Power</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form-input"
                      value={editForm.le_add}
                      onChange={(e) => setEditForm({ ...editForm, le_add: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visual Acuity</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.le_va}
                      onChange={(e) => setEditForm({ ...editForm, le_va: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">L PD (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={editForm.le_pd}
                      onChange={(e) => {
                        const l = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, le_pd: l, total_pd: editForm.re_pd + l });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#92400e' }}>
                  Remark / Lab Instructions
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Prescription remarks or instructions communicated to the lab..."
                  value={editForm.rx_notes}
                  onChange={(e) => setEditForm({ ...editForm, rx_notes: e.target.value })}
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: FRAME & LENS SPECS */}
          {editTab === 'specs' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '8px' }}>
                  Frame Specifications
                </h4>
                <div className="grid-cols-2" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Frame Company / Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ray-Ban, Fastrack, Titan"
                      value={editForm.frame_company}
                      onChange={(e) => setEditForm({ ...editForm, frame_company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frame Model / Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. RB-5154"
                      value={editForm.frame_model}
                      onChange={(e) => setEditForm({ ...editForm, frame_model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid-cols-2" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Frame Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.frame_type}
                      onChange={(e) => setEditForm({ ...editForm, frame_type: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frame Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm.frame_price}
                      onChange={(e) => setEditForm({ ...editForm, frame_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '8px' }}>
                  Lens Specifications
                </h4>
                <div className="grid-cols-2" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Lens For</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.lens_for}
                      onChange={(e) => setEditForm({ ...editForm, lens_for: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lens Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.lens_type}
                      onChange={(e) => setEditForm({ ...editForm, lens_type: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid-cols-3" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Lens Company</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.lens_company}
                      onChange={(e) => setEditForm({ ...editForm, lens_company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lens Product</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.lens_product}
                      onChange={(e) => setEditForm({ ...editForm, lens_product: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lens Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm.lens_price}
                      onChange={(e) => setEditForm({ ...editForm, lens_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING & NOTES */}
          {editTab === 'order' && (
            <div>
              <div className="grid-cols-2" style={{ gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={editForm.discount_type}
                    onChange={(e) => setEditForm({ ...editForm, discount_type: e.target.value })}
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editForm.discount_value}
                    onChange={(e) => setEditForm({ ...editForm, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Expected Delivery Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.expected_delivery}
                  onChange={(e) => setEditForm({ ...editForm, expected_delivery: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order Notes / Customer Remarks</label>
                <textarea
                  className="form-textarea"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
              <Save size={16} /> {isSavingEdit ? 'Saving...' : 'Save & Update Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={t('Collect Balance Payment')}>
        <form onSubmit={handleAddPayment}>
          <div className="form-group">
            <label className="form-label">{t('Payment Amount (₹)')} *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Payment Mode')}</label>
              <select className="form-select" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                <option value="cash">{t('Cash')}</option>
                <option value="upi">{t('UPI (GPay, PhonePe, Paytm)')}</option>
                <option value="card">{t('Credit / Debit Card')}</option>
                <option value="bank_transfer">{t('Bank Transfer')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Transaction Ref')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="UPI / Card Txn #"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Record Payment')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Advance Status Modal */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title={t('Update Optical Job Stage')}>
        <form onSubmit={handleUpdateStatus}>
          <div className="form-group">
            <label className="form-label">{t('Select Stage')}</label>
            <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="pending">{t('Pending / Booked')}</option>
              <option value="in_lab">{t('In Lab (Lens Ordered)')}</option>
              <option value="fitting">{t('Fitting (Frame & Lens Edging)')}</option>
              <option value="ready">{t('Ready for Pickup')}</option>
              <option value="delivered">{t('Delivered to Customer')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('Stage Remarks')}</label>
            <input
              type="text"
              className="form-input"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStatusOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Save Stage')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
