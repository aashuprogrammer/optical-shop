'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import {
  Truck,
  Search,
  PlusCircle,
  CreditCard,
  Building,
  Calendar,
  FileText,
} from 'lucide-react';
import { PurchaseBill, Vendor, Product } from '@/lib/types';

export default function PurchasesPage() {
  const { t } = useTranslation();
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'bills' | 'vendors'>('bills');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isAddBillOpen, setIsAddBillOpen] = useState<boolean>(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState<boolean>(false);
  const [isPayVendorOpen, setIsPayVendorOpen] = useState<boolean>(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // New Vendor Form
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    city: '',
    notes: '',
  });

  // New Purchase Bill Form
  const [billForm, setBillForm] = useState<any>({
    vendor_id: 0,
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount_paid: 0,
    notes: '',
    items: [
      { product_id: null, name: '', quantity: 10, unit_price: 0, tax_rate: 18 },
    ],
  });

  // Vendor Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('bank_transfer');
  const [payRef, setPayRef] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsRes, vendorsRes, productsRes] = await Promise.all([
        api.getPurchaseBills({ search }),
        api.getVendors(),
        api.getProducts({ limit: 100 }),
      ]);
      if (billsRes.success && billsRes.data) setBills(billsRes.data.bills || []);
      if (vendorsRes.success && vendorsRes.data) setVendors(vendorsRes.data || []);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data.products || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createVendor(vendorForm);
    if (res.success) {
      setIsAddVendorOpen(false);
      setVendorForm({ name: '', contact_person: '', phone: '', email: '', gstin: '', city: '', notes: '' });
      loadData();
    } else {
      alert(res.error || 'Failed to add vendor');
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.vendor_id) {
      alert(t('Please select a supplier/vendor'));
      return;
    }

    const res = await api.createPurchaseBill(billForm);
    if (res.success) {
      setIsAddBillOpen(false);
      loadData();
    } else {
      alert(res.error || 'Failed to create purchase bill');
    }
  };

  const handlePayVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || payAmount <= 0) return;

    const res = await api.recordVendorPayment({
      vendor_id: selectedVendor.id,
      amount: payAmount,
      payment_mode: payMode,
      transaction_ref: payRef,
      notes: 'Vendor payment payout',
    });
    if (res.success) {
      setIsPayVendorOpen(false);
      setSelectedVendor(null);
      loadData();
    } else {
      alert(res.error || 'Failed to record vendor payment');
    }
  };

  return (
    <div>
      {/* Header & Tabs */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('Purchases & Vendor Ledger')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Record inventory inward bills, track wholesale frame/lens suppliers, and pay vendor balances.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsAddVendorOpen(true)}>
            <Building size={16} /> {t('Add Vendor')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddBillOpen(true)}>
            <PlusCircle size={16} /> {t('Record Inward Bill')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn btn-sm ${activeTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bills')}
        >
          {t('Purchase Bills & Inward')}
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vendors')}
        >
          {t('Suppliers & Vendors List')}
        </button>
      </div>

      {activeTab === 'bills' ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Bill #')}</th>
                <th>{t('Vendor / Supplier')}</th>
                <th>{t('Bill Date')}</th>
                <th style={{ textAlign: 'right' }}>{t('Total Amount')}</th>
                <th style={{ textAlign: 'right' }}>{t('Paid')}</th>
                <th style={{ textAlign: 'right' }}>{t('Balance Due')}</th>
                <th>{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    {loading ? t('Loading purchase bills...') : t('No purchase bills recorded yet.')}
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bill_number}</strong></td>
                    <td>{b.vendor_name || `Vendor #${b.vendor_id}`}</td>
                    <td>{new Date(b.bill_date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{Number(b.total_amount).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>₹{Number(b.amount_paid).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: Number(b.balance) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                      ₹{Number(b.balance).toFixed(2)}
                    </td>
                    <td><span className={`badge badge-${b.status}`}>{t(b.status)}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Vendor Name')}</th>
                <th>{t('Contact Person')}</th>
                <th>{t('Phone')}</th>
                <th>{t('GSTIN')}</th>
                <th style={{ textAlign: 'right' }}>{t('Outstanding Payable')}</th>
                <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    {loading ? t('Loading suppliers...') : t('No vendors registered yet.')}
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.name}</strong></td>
                    <td>{v.contact_person || '-'}</td>
                    <td>{v.phone || '-'}</td>
                    <td>{v.gstin || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: Number(v.outstanding_balance) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{Number(v.outstanding_balance).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedVendor(v); setPayAmount(Number(v.outstanding_balance)); setIsPayVendorOpen(true); }}
                      >
                        <CreditCard size={14} /> {t('Pay Vendor')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vendor Modal */}
      <Modal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} title={t('Add Optical Supplier / Vendor')}>
        <form onSubmit={handleCreateVendor}>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Company / Vendor Name')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Contact Person')}</label>
              <input
                type="text"
                className="form-input"
                value={vendorForm.contact_person}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('Phone Number')}</label>
              <input
                type="tel"
                className="form-input"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('GSTIN')}</label>
              <input
                type="text"
                className="form-input"
                value={vendorForm.gstin}
                onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('City')}</label>
              <input
                type="text"
                className="form-input"
                value={vendorForm.city}
                onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddVendorOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Save Vendor')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Purchase Bill Modal */}
      <Modal isOpen={isAddBillOpen} onClose={() => setIsAddBillOpen(false)} title={t('Record Stock Inward Bill')} maxWidth="720px">
        <form onSubmit={handleCreateBill}>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('Select Vendor')} *</label>
              <select
                className="form-select"
                required
                value={billForm.vendor_id}
                onChange={(e) => setBillForm({ ...billForm, vendor_id: parseInt(e.target.value) || 0 })}
              >
                <option value={0}>{t('-- Choose Vendor --')}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Vendor Bill / Invoice #')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={billForm.bill_number}
                onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Bill Date')}</label>
              <input
                type="date"
                className="form-input"
                value={billForm.bill_date}
                onChange={(e) => setBillForm({ ...billForm, bill_date: e.target.value })}
              />
            </div>
          </div>

          <h4 style={{ margin: '14px 0 8px', fontSize: '0.9rem' }}>{t('Inward Stock Items')}</h4>
          {billForm.items.map((item: any, idx: number) => (
            <div key={idx} className="grid-cols-4" style={{ marginBottom: '8px' }}>
              <div className="form-group">
                <label className="form-label">{t('Link Product')}</label>
                <select
                  className="form-select"
                  value={item.product_id || ''}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === parseInt(e.target.value));
                    const next = [...billForm.items];
                    next[idx].product_id = prod ? prod.id : null;
                    if (prod) {
                      next[idx].name = prod.name;
                      next[idx].unit_price = Number(prod.purchase_price);
                    }
                    setBillForm({ ...billForm, items: next });
                  }}
                >
                  <option value="">{t('-- Product --')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('Item Name')} *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={item.name}
                  onChange={(e) => {
                    const next = [...billForm.items];
                    next[idx].name = e.target.value;
                    setBillForm({ ...billForm, items: next });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Qty')}</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...billForm.items];
                    next[idx].quantity = parseInt(e.target.value) || 1;
                    setBillForm({ ...billForm, items: next });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Cost Price (₹)')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={item.unit_price}
                  onChange={(e) => {
                    const next = [...billForm.items];
                    next[idx].unit_price = parseFloat(e.target.value) || 0;
                    setBillForm({ ...billForm, items: next });
                  }}
                />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddBillOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Save Bill & Inward Stock')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Vendor Modal */}
      {selectedVendor && (
        <Modal isOpen={isPayVendorOpen} onClose={() => setIsPayVendorOpen(false)} title={`${t('Pay Vendor')}: ${selectedVendor.name}`}>
          <form onSubmit={handlePayVendor}>
            <div className="form-group">
              <label className="form-label">{t('Payment Payout Amount (₹)')} *</label>
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
                  <option value="bank_transfer">{t('NEFT / RTGS / Bank Transfer')}</option>
                  <option value="upi">{t('UPI')}</option>
                  <option value="cash">{t('Cash')}</option>
                  <option value="cheque">{t('Cheque')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('Transaction Ref')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bank UTR / Ref #"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsPayVendorOpen(false)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('Record Payout')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
