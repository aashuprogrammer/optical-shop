'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import { Receipt, PlusCircle, Trash2, IndianRupee, Calendar } from 'lucide-react';
import { Expense } from '@/lib/types';

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [form, setForm] = useState({
    title: '',
    category_id: 0,
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash',
    expense_type: 'one_time',
    notes: '',
  });

  useEffect(() => {
    loadExpenses();
    api.getExpenseCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses();
      if (res.success && res.data) {
        setExpenses(res.data.expenses || []);
        setSummary(res.data.summary || {});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createExpense({
      ...form,
      category_id: form.category_id > 0 ? form.category_id : null,
    });
    if (res.success) {
      setIsAddOpen(false);
      setForm({ title: '', category_id: 0, amount: 0, expense_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', expense_type: 'one_time', notes: '' });
      loadExpenses();
    } else {
      alert(res.error || 'Failed to record expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this expense record?'))) return;
    const res = await api.deleteExpense(id);
    if (res.success) loadExpenses();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('Store Expense Tracker')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Log daily optical shop expenses (rent, electricity, optometrist wages, lens edger maintenance).')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <PlusCircle size={16} /> {t('Record Expense')}
        </button>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">{t('Total Recorded Expenses')}</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>
              ₹{Number(summary.total_amount || 0).toLocaleString()}
            </div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <Receipt size={18} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">{t('One-Time Expenses')}</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
              ₹{Number(summary.one_time_amount || 0).toLocaleString()}
            </div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px' }}><IndianRupee size={18} /></div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">{t('Recurring Expenses (Rent/Bills)')}</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
              ₹{Number(summary.recurring_amount || 0).toLocaleString()}
            </div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px' }}><Calendar size={18} /></div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Expense Title')}</th>
              <th>{t('Category')}</th>
              <th>{t('Date')}</th>
              <th>{t('Payment Mode')}</th>
              <th style={{ textAlign: 'right' }}>{t('Amount')}</th>
              <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {loading ? t('Loading expenses...') : t('No store expenses recorded yet.')}
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.title}</strong></td>
                  <td>{e.category_name || t('General')}</td>
                  <td>{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td><span style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{e.payment_mode}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                    ₹{Number(e.amount).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteExpense(e.id)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('Record Store Expense')}>
        <form onSubmit={handleCreateExpense}>
          <div className="form-group">
            <label className="form-label">{t('Expense Title')} *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Shop electricity bill / Lens edging supplies"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Amount (₹)')} *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Category')}</label>
              <select
                className="form-select"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) || 0 })}
              >
                <option value={0}>{t('-- General Expense --')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Date')}</label>
              <input
                type="date"
                className="form-input"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Payment Mode')}</label>
              <select className="form-select" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                <option value="cash">{t('Cash')}</option>
                <option value="upi">{t('UPI')}</option>
                <option value="bank_transfer">{t('Bank Transfer')}</option>
                <option value="card">{t('Card')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Save Expense')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
