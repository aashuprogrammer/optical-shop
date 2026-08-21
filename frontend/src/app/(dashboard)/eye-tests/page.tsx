'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { Modal } from '@/components/Modal';
import { OpticalCalculatorModal } from '@/components/OpticalCalculatorModal';
import { api } from '@/lib/api';
import {
  Eye,
  Search,
  PlusCircle,
  Calculator,
  Calendar,
  User,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { Customer, EyeTest } from '@/lib/types';

export default function EyeTestsPage() {
  const { t } = useTranslation();
  const [tests, setTests] = useState<EyeTest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [selectedTest, setSelectedTest] = useState<EyeTest | null>(null);

  // New Rx Form
  const [formData, setFormData] = useState({
    customer_id: 0,
    test_date: new Date().toISOString().split('T')[0],
    re_sph: 0,
    re_cyl: 0,
    re_axis: 0,
    re_add: 0,
    re_pd: 31.5,
    re_prism: 0,
    re_prism_base: '',
    re_visual_acuity: '6/6',
    le_sph: 0,
    le_cyl: 0,
    le_axis: 0,
    le_add: 0,
    le_pd: 31.5,
    le_prism: 0,
    le_prism_base: '',
    le_visual_acuity: '6/6',
    doctor_name: '',
    notes: '',
  });

  useEffect(() => {
    loadEyeTests();
    api.getCustomers({ limit: 100 }).then((res) => {
      if (res.success && res.data) setCustomers(res.data.customers || []);
    });
  }, [search, from, to]);

  const loadEyeTests = async () => {
    setLoading(true);
    try {
      const res = await api.getEyeTests({ search, from, to });
      if (res.success && res.data) {
        setTests(res.data.eye_tests || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEyeTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert(t('Please select a customer for the examination'));
      return;
    }

    const res = await api.createEyeTest(formData);
    if (res.success) {
      setIsAddOpen(false);
      loadEyeTests();
    } else {
      alert(res.error || 'Failed to save eye test');
    }
  };

  return (
    <div>
      {/* Page Title & Actions */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('Clinical Eye Tests & Prescriptions')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Optical power refractions, visual acuity, pupillary distance (PD), and transposition records.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsCalcOpen(true)}>
            <ArrowRightLeft size={16} /> {t('Optical Formulas')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <PlusCircle size={16} /> {t('Record Eye Test')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder={t('Search by test number, customer name, or phone...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('From')}:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px' }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('To')}:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px' }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Tests Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Test #')}</th>
              <th>{t('Customer')}</th>
              <th>{t('OD (Right Eye)')}</th>
              <th>{t('OS (Left Eye)')}</th>
              <th>{t('Exam Date')}</th>
              <th>{t('Optometrist')}</th>
              <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {loading ? t('Loading refraction records...') : t('No eye test examinations found.')}
                </td>
              </tr>
            ) : (
              tests.map((test) => (
                <tr key={test.id} onClick={() => setSelectedTest(test)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>{test.test_number}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{test.customer_name || `Customer #${test.customer_id}`}</span>
                    {test.customer_phone && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        {test.customer_phone}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      SPH: {test.re_sph || '0.00'} | CYL: {test.re_cyl || '0.00'} | AX: {test.re_axis || 0}°
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      SPH: {test.le_sph || '0.00'} | CYL: {test.le_cyl || '0.00'} | AX: {test.le_axis || 0}°
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                      <Calendar size={13} color="var(--text-muted)" />
                      {new Date(test.test_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{test.doctor_name || 'Optometrist'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedTest(test); }}>
                      {t('View Rx')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record New Eye Test Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('New Eye Examination (Clinical Refraction)')} maxWidth="780px">
        <form onSubmit={handleCreateEyeTest}>
          <div className="grid-cols-2" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">{t('Select Patient / Customer')} *</label>
              <select
                className="form-select"
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) || 0 })}
              >
                <option value={0}>{t('-- Choose Customer --')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ''} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Examination Date')}</label>
              <input
                type="date"
                className="form-input"
                value={formData.test_date}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-hover)', margin: '14px 0 8px' }}>
            {t('Right Eye (OD - Oculus Dexter)')}
          </h3>
          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">{t('SPH (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.re_sph}
                onChange={(e) => setFormData({ ...formData, re_sph: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('CYL (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.re_cyl}
                onChange={(e) => setFormData({ ...formData, re_cyl: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('AXIS (°)')}</label>
              <input
                type="number"
                min="0"
                max="180"
                className="form-input"
                value={formData.re_axis}
                onChange={(e) => setFormData({ ...formData, re_axis: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('ADD (Near)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.re_add}
                onChange={(e) => setFormData({ ...formData, re_add: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('PD (mm)')}</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.re_pd}
                onChange={(e) => setFormData({ ...formData, re_pd: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Prism (Δ)')}</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.re_prism}
                onChange={(e) => setFormData({ ...formData, re_prism: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Visual Acuity')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="6/6"
                value={formData.re_visual_acuity}
                onChange={(e) => setFormData({ ...formData, re_visual_acuity: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-hover)', margin: '18px 0 8px' }}>
            {t('Left Eye (OS - Oculus Sinister)')}
          </h3>
          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">{t('SPH (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.le_sph}
                onChange={(e) => setFormData({ ...formData, le_sph: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('CYL (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.le_cyl}
                onChange={(e) => setFormData({ ...formData, le_cyl: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('AXIS (°)')}</label>
              <input
                type="number"
                min="0"
                max="180"
                className="form-input"
                value={formData.le_axis}
                onChange={(e) => setFormData({ ...formData, le_axis: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('ADD (Near)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={formData.le_add}
                onChange={(e) => setFormData({ ...formData, le_add: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('PD (mm)')}</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.le_pd}
                onChange={(e) => setFormData({ ...formData, le_pd: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Prism (Δ)')}</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.le_prism}
                onChange={(e) => setFormData({ ...formData, le_prism: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Visual Acuity')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="6/6"
                value={formData.le_visual_acuity}
                onChange={(e) => setFormData({ ...formData, le_visual_acuity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">{t('Optometrist / Doctor Name')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('Dr. / Optometrist name')}
                value={formData.doctor_name}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Clinical Advice / Recommendations')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('e.g. Anti-glare coating recommended')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Save Refraction Record')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Selected Test Detail Modal */}
      {selectedTest && (
        <Modal isOpen={!!selectedTest} onClose={() => setSelectedTest(null)} title={`${t('Prescription')} #${selectedTest.test_number}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.85rem' }}>
              <span><strong>{t('Patient')}:</strong> {selectedTest.customer_name || `#${selectedTest.customer_id}`}</span>
              <span><strong>{t('Date')}:</strong> {new Date(selectedTest.test_date).toLocaleDateString()}</span>
            </div>

            <table className="rx-table">
              <thead>
                <tr>
                  <th>{t('Eye')}</th><th>{t('SPH')}</th><th>{t('CYL')}</th><th>{t('AXIS')}</th><th>{t('ADD')}</th><th>{t('PD')}</th><th>{t('V.A.')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="eye-label">{t('OD (Right)')}</td>
                  <td>{selectedTest.re_sph || '-'}</td>
                  <td>{selectedTest.re_cyl || '-'}</td>
                  <td>{selectedTest.re_axis || '-'}</td>
                  <td>{selectedTest.re_add || '-'}</td>
                  <td>{selectedTest.re_pd || '-'}</td>
                  <td>{selectedTest.re_visual_acuity || '-'}</td>
                </tr>
                <tr>
                  <td className="eye-label">{t('OS (Left)')}</td>
                  <td>{selectedTest.le_sph || '-'}</td>
                  <td>{selectedTest.le_cyl || '-'}</td>
                  <td>{selectedTest.le_axis || '-'}</td>
                  <td>{selectedTest.le_add || '-'}</td>
                  <td>{selectedTest.le_pd || '-'}</td>
                  <td>{selectedTest.le_visual_acuity || '-'}</td>
                </tr>
              </tbody>
            </table>

            {selectedTest.notes && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>{t('Doctor Notes')}:</strong> {selectedTest.notes}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Optical Calculator Tool */}
      <OpticalCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </div>
  );
}
