'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import {
  ShoppingBag,
  Search,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  CreditCard,
  Ban,
  Calendar,
  Edit,
} from 'lucide-react';
import { Order } from '@/lib/types';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Booked / Pending' },
  { key: 'in_lab', label: 'In Lab' },
  { key: 'fitting', label: 'Fitting' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('cash');
  const [payRef, setPayRef] = useState<string>('');

  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [status, paymentStatus, search]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders({
        status,
        payment_status: paymentStatus,
        search,
      });
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrder || payAmount <= 0) return;

    const res = await api.addOrderPayment(paymentOrder.id, {
      amount: payAmount,
      payment_mode: payMode,
      transaction_ref: payRef,
    });
    if (res.success) {
      setPaymentOrder(null);
      setPayAmount(0);
      loadOrders();
    } else {
      alert(res.error || 'Failed to record payment');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusOrder || !newStatus) return;

    const res = await api.updateOrderStatus(statusOrder.id, {
      status: newStatus,
      notes: statusNote,
    });
    if (res.success) {
      setStatusOrder(null);
      setStatusNote('');
      loadOrders();
    } else {
      alert(res.error || 'Failed to update order status');
    }
  };

  return (
    <div>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('POS Orders & Optical Jobs')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Track customer eyewear orders, lab processing stages, delivery schedules, and payment balances.')}
          </p>
        </div>

        <Link href="/orders/new" className="btn btn-primary">
          <PlusCircle size={16} /> {t('Create POS Order')}
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${status === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatus(tab.key)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Search & Payment Filter Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px' }}
            placeholder={t('Search by order #, customer name, phone...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="all">{t('All Payment Status')}</option>
          <option value="pending">{t('Payment Pending')}</option>
          <option value="partial">{t('Partially Paid')}</option>
          <option value="paid">{t('Fully Paid')}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Order #')}</th>
              <th>{t('Customer')}</th>
              <th>{t('Type')}</th>
              <th>{t('Status')}</th>
              <th style={{ textAlign: 'right' }}>{t('Total')}</th>
              <th style={{ textAlign: 'right' }}>{t('Balance Due')}</th>
              <th>{t('Delivery Date')}</th>
              <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {loading ? t('Loading orders...') : t('No orders found matching your criteria.')}
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link
                      href={`/orders/${o.id}`}
                      style={{ fontWeight: 700, color: 'var(--primary-hover)', textDecoration: 'underline' }}
                    >
                      #{o.order_number}
                    </Link>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{o.first_name} {o.last_name || ''}</span>
                    {o.customer_phone && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        {o.customer_phone}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                      {o.order_type}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`badge badge-${o.status}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => { setStatusOrder(o); setNewStatus(o.status); }}
                      title={t('Click to change job stage')}
                    >
                      {t(o.status)}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ₹{Number(o.grand_total).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {Number(o.balance_due) > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        ₹{Number(o.balance_due).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.82rem' }}>
                        {t('Paid')}
                      </span>
                    )}
                  </td>
                  <td>
                    {o.expected_delivery ? (
                      <span style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {new Date(o.expected_delivery).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <Link href={`/orders/${o.id}`} className="btn btn-secondary btn-sm" title="View / Edit Order">
                        <Eye size={14} />
                      </Link>
                      <Link href={`/orders/${o.id}`} className="btn btn-secondary btn-sm" title="Edit Order Details">
                        <Edit size={14} />
                      </Link>
                      {Number(o.balance_due) > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setPaymentOrder(o); setPayAmount(Number(o.balance_due)); }}
                          title={t('Collect Balance Payment')}
                        >
                          <CreditCard size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Collect Payment Modal */}
      {paymentOrder && (
        <Modal
          isOpen={!!paymentOrder}
          onClose={() => setPaymentOrder(null)}
          title={`${t('Record Payment')} - #${paymentOrder.order_number}`}
        >
          <form onSubmit={handleAddPayment}>
            <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.85rem' }}><strong>{t('Customer')}:</strong> {paymentOrder.first_name} {paymentOrder.last_name || ''}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}><strong>{t('Remaining Balance Due')}:</strong> ₹{Number(paymentOrder.balance_due).toFixed(2)}</p>
            </div>

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
                <label className="form-label">{t('Transaction Ref #')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UPI Ref / Txn ID"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPaymentOrder(null)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('Record Payment')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Advance Order Status Modal */}
      {statusOrder && (
        <Modal
          isOpen={!!statusOrder}
          onClose={() => setStatusOrder(null)}
          title={`${t('Update Order Stage')} - #${statusOrder.order_number}`}
        >
          <form onSubmit={handleUpdateStatus}>
            <div className="form-group">
              <label className="form-label">{t('New Job Stage')}</label>
              <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="pending">{t('Pending / Booked')}</option>
                <option value="in_lab">{t('In Lab (Lens Ordering)')}</option>
                <option value="fitting">{t('Fitting (Frame & Lens Edging)')}</option>
                <option value="ready">{t('Ready for Customer Pickup')}</option>
                <option value="delivered">{t('Delivered to Customer')}</option>
                <option value="cancelled">{t('Cancelled (Restores Stock)')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('Internal Note / Remarks')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('e.g. Sent to Essilor lab')}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStatusOrder(null)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('Update Stage')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
