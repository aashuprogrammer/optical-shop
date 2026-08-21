'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Repair, RepairStats, Customer, Shop } from '@/lib/types';
import { Modal } from '@/components/Modal';
import {
  Wrench,
  Search,
  Plus,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Printer,
  Edit2,
  Trash2,
  ChevronRight,
  Filter,
  DollarSign,
  User,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [stats, setStats] = useState<RepairStats | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  // New Repair Form State
  const [formData, setFormData] = useState({
    customer_id: null as number | null,
    customer_name: '',
    customer_phone: '',
    customer_city: '',
    repair_type: 'frame_repair',
    item_description: '',
    problem_description: '',
    total_amount: 0,
    advance_paid: 0,
    payment_mode: 'cash',
    expected_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    technician_name: 'In-Shop Lab',
    notes: '',
  });

  // Status Change State
  const [newStatus, setNewStatus] = useState<string>('in_progress');

  // Customer search in New Repair form
  const [custSearch, setCustSearch] = useState<string>('');
  const [custMatches, setCustMatches] = useState<Customer[]>([]);

  useEffect(() => {
    loadData();
    api.getShop().then((res) => {
      if (res.success && res.data) setShop(res.data);
    });
    api.getCustomers({ limit: 100 }).then((res) => {
      if (res.success && res.data) setCustomers(res.data.customers || []);
    });
  }, [search, statusFilter, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.getRepairs({
          search,
          status: statusFilter,
          repair_type: typeFilter,
        }),
        api.getRepairStats(),
      ]);

      if (listRes.success && listRes.data) {
        setRepairs(listRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer Autocomplete Filter
  useEffect(() => {
    if (!custSearch.trim() || formData.customer_id) {
      setCustMatches([]);
      return;
    }
    const q = custSearch.toLowerCase();
    const matches = customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
    setCustMatches(matches.slice(0, 5));
  }, [custSearch, customers, formData.customer_id]);

  const handleSelectCustomer = (c: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customer_id: c.id,
      customer_name: `${c.first_name} ${c.last_name || ''}`.trim(),
      customer_phone: c.phone || '',
      customer_city: c.city || '',
    }));
    setCustSearch(`${c.first_name} ${c.last_name || ''}`.trim());
    setCustMatches([]);
  };

  const handleClearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customer_id: null,
      customer_name: '',
      customer_phone: '',
      customer_city: '',
    }));
    setCustSearch('');
  };

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      alert('Please provide customer name');
      return;
    }
    if (!formData.item_description.trim()) {
      alert('Please describe the item (frame / lens model)');
      return;
    }

    const res = await api.createRepair(formData);
    if (res.success && res.data) {
      setIsAddOpen(false);
      setSelectedRepair(res.data);
      setIsPrintOpen(true);
      resetForm();
      loadData();
    } else {
      alert(res.error || 'Failed to create repair job');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRepair) return;
    const res = await api.updateRepairStatus(selectedRepair.id, newStatus);
    if (res.success) {
      setIsStatusOpen(false);
      loadData();
      if (selectedRepair) {
        setSelectedRepair({ ...selectedRepair, status: newStatus });
      }
    } else {
      alert(res.error || 'Failed to update status');
    }
  };

  const handleDeleteRepair = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repair record?')) return;
    const res = await api.deleteRepair(id);
    if (res.success) {
      loadData();
      if (selectedRepair?.id === id) {
        setIsDetailOpen(false);
      }
    } else {
      alert(res.error || 'Failed to delete repair');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: null,
      customer_name: '',
      customer_phone: '',
      customer_city: '',
      repair_type: 'frame_repair',
      item_description: '',
      problem_description: '',
      total_amount: 0,
      advance_paid: 0,
      payment_mode: 'cash',
      expected_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      technician_name: 'In-Shop Lab',
      notes: '',
    });
    setCustSearch('');
    setCustMatches([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <span className="badge badge-pending">Received</span>;
      case 'in_progress':
        return <span className="badge badge-processing">In Progress</span>;
      case 'ready':
        return <span className="badge badge-ready">Ready for Pickup</span>;
      case 'delivered':
        return <span className="badge badge-delivered">Delivered</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'frame_repair':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
            }}
          >
            👓 Frame Repair
          </span>
        );
      case 'lens_change':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
            }}
          >
            🔍 Lens Change
          </span>
        );
      case 'both':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
            }}
          >
            👓+🔍 Frame & Lens
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
            }}
          >
            🛠️ Service
          </span>
        );
    }
  };

  const balanceDueCalc = Math.max(
    0,
    (Number(formData.total_amount) || 0) - (Number(formData.advance_paid) || 0)
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Repairing & Lens Replacement Section</h1>
          <p className="page-subtitle">
            Manage frame repairs, lens changes, solder/hinge fixes, and job cards.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
        >
          <Plus size={16} /> New Repair Job
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Active / In-Shop</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
              {(Number(stats?.count_received) || 0) + (Number(stats?.count_in_progress) || 0)}
            </div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px' }}>
            <Wrench size={18} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Ready for Delivery</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>
              {stats?.count_ready || 0}
            </div>
          </div>
          <div
            className="kpi-icon"
            style={{ width: '36px', height: '36px', backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Delivered (Completed)</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
              {stats?.count_delivered || 0}
            </div>
          </div>
          <div
            className="kpi-icon"
            style={{ width: '36px', height: '36px', backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
          >
            <Layers size={18} />
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Repair Dues Pending</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>
              ₹{Number(stats?.total_pending_dues || 0).toLocaleString()}
            </div>
          </div>
          <div
            className="kpi-icon"
            style={{ width: '36px', height: '36px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px' }}
            placeholder="Search by Job #, customer name, phone, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ width: '170px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="received">Received</option>
          <option value="in_progress">In Progress</option>
          <option value="ready">Ready for Pickup</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Repair Type Filter */}
        <select
          className="form-select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Repair Types</option>
          <option value="frame_repair">👓 Frame Repair</option>
          <option value="lens_change">🔍 Lens Change</option>
          <option value="both">👓+🔍 Frame & Lens</option>
          <option value="other">🛠️ Other Service</option>
        </select>
      </div>

      {/* Repairs Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Job #</th>
              <th>Customer</th>
              <th>Service Type</th>
              <th>Item & Problem</th>
              <th>Status</th>
              <th>Delivery</th>
              <th style={{ textAlign: 'right' }}>Charges</th>
              <th style={{ textAlign: 'right' }}>Due</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading repair records...' : 'No repair jobs found matching criteria.'}
                </td>
              </tr>
            ) : (
              repairs.map((r) => (
                <tr
                  key={r.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedRepair(r);
                    setIsDetailOpen(true);
                  }}
                >
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>
                      {r.repair_number}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block' }}>
                      {new Date(r.received_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.customer_name}</span>
                    {r.customer_phone && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Phone size={11} color="var(--primary)" /> {r.customer_phone}
                      </span>
                    )}
                  </td>
                  <td>{getTypeBadge(r.repair_type)}</td>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{r.item_description}</strong>
                    {r.problem_description && (
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.problem_description}
                      </p>
                    )}
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    {r.expected_delivery ? (
                      <span style={{ fontSize: '0.82rem' }}>
                        {new Date(r.expected_delivery).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(r.total_amount).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {Number(r.balance_due) > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        ₹{Number(r.balance_due).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: '0.82rem' }}>Paid</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        title="Update Stage / Status"
                        onClick={() => {
                          setSelectedRepair(r);
                          setNewStatus(r.status);
                          setIsStatusOpen(true);
                        }}
                      >
                        <Edit2 size={15} color="var(--primary)" />
                      </button>
                      <button
                        className="btn-icon"
                        title="Print Job Slip"
                        onClick={() => {
                          setSelectedRepair(r);
                          setIsPrintOpen(true);
                        }}
                      >
                        <Printer size={15} color="var(--text-muted)" />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        onClick={() => handleDeleteRepair(r.id)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Repair Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Repair & Service Job" maxWidth="680px">
        <form onSubmit={handleCreateRepair}>
          {/* Customer Selection */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label className="form-label">Customer Search / Name *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search existing customer or enter name..."
                  value={formData.customer_name}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_name: e.target.value });
                    setCustSearch(e.target.value);
                  }}
                  required
                />
                {custMatches.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 20,
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}
                  >
                    {custMatches.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '0.85rem',
                        }}
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <strong>{c.first_name} {c.last_name || ''}</strong> &nbsp;
                        <span style={{ color: 'var(--text-muted)' }}>({c.phone || c.city || 'No phone'})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.customer_id && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearCustomer}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Customer Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City / Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Local / City"
                value={formData.customer_city}
                onChange={(e) => setFormData({ ...formData, customer_city: e.target.value })}
              />
            </div>
          </div>

          {/* Service / Repair Type Selection */}
          <div className="form-group">
            <label className="form-label">Service Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'frame_repair', label: '👓 Frame Repair' },
                { id: 'lens_change', label: '🔍 Lens Change' },
                { id: 'both', label: '👓+🔍 Both' },
                { id: 'other', label: '🛠️ Other' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${formData.repair_type === opt.id ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: formData.repair_type === opt.id ? 'var(--primary-light)' : 'var(--bg-muted)',
                    color: formData.repair_type === opt.id ? 'var(--primary-hover)' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => setFormData({ ...formData, repair_type: opt.id })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Item / Frame / Lens Description *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Titan Black Metal Frame / Crizal Blue Lenses"
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.expected_delivery}
                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem / Service Required</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '60px' }}
              placeholder="e.g. Temple hinge broken, screw missing, replace with +2.00 single vision lens, solder bridge..."
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
            />
          </div>

          {/* Pricing & Advance Details */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '16px',
            }}
          >
            <div className="grid-cols-3">
              <div className="form-group">
                <label className="form-label">Total Repair Charges (₹) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={formData.total_amount || ''}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Advance Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={formData.total_amount}
                  className="form-input"
                  placeholder="0"
                  value={formData.advance_paid || ''}
                  onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span>Balance Due on Pickup:</span>
              <span style={{ color: balanceDueCalc > 0 ? 'var(--danger)' : 'var(--success)' }}>
                ₹{balanceDueCalc.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Technician / Lab</label>
              <input
                type="text"
                className="form-input"
                value={formData.technician_name}
                onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Case color, cloth included, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Job & Print Slip
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      {selectedRepair && (
        <Modal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          title={`Update Status: ${selectedRepair.repair_number}`}
        >
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Customer: <strong>{selectedRepair.customer_name}</strong> | Item: <strong>{selectedRepair.item_description}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Select Current Job Stage</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'received', label: 'Received (In Queue)', desc: 'Item accepted in shop' },
                  { id: 'in_progress', label: 'In Progress (Repairing / Fitting)', desc: 'Lab is working on it' },
                  { id: 'ready', label: 'Ready for Pickup (Completed)', desc: 'Work done, ready for customer' },
                  { id: 'delivered', label: 'Delivered to Customer', desc: 'Handed over and dues settled' },
                  { id: 'cancelled', label: 'Cancelled', desc: 'Could not be repaired / returned' },
                ].map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${newStatus === s.id ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: newStatus === s.id ? 'var(--primary-light)' : 'var(--bg-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="status_radio"
                      value={s.id}
                      checked={newStatus === s.id}
                      onChange={() => setNewStatus(s.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsStatusOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateStatus}>
                Update Stage
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Repair Detail Modal */}
      {selectedRepair && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Job Record: ${selectedRepair.repair_number}`}
          maxWidth="640px"
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status</span>
                <div style={{ marginTop: '2px' }}>{getStatusBadge(selectedRepair.status)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Service Category</span>
                <div style={{ marginTop: '2px' }}>{getTypeBadge(selectedRepair.repair_type)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received Date</span>
                <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                  {new Date(selectedRepair.received_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid-cols-2" style={{ marginBottom: '16px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Details</span>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: '4px 0 2px 0' }}>{selectedRepair.customer_name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>📞 {selectedRepair.customer_phone || 'No phone'}</p>
                {selectedRepair.customer_city && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>📍 {selectedRepair.customer_city}</p>
                )}
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected Delivery</span>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: '4px 0 2px 0' }}>
                  {selectedRepair.expected_delivery ? new Date(selectedRepair.expected_delivery).toLocaleDateString() : 'N/A'}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Technician: {selectedRepair.technician_name || 'In-House'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item Description:</span>
              <p style={{ fontWeight: 700, margin: '2px 0 8px 0' }}>{selectedRepair.item_description}</p>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Problem Description / Service Notes:</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem' }}>{selectedRepair.problem_description || 'No detailed notes'}</p>
            </div>

            {/* Financial Ledger */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Service Charges:</span>
                <strong style={{ fontSize: '1rem' }}>₹{Number(selectedRepair.total_amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--success)' }}>
                <span>Advance Paid:</span>
                <strong>-₹{Number(selectedRepair.advance_paid).toFixed(2)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border)',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: Number(selectedRepair.balance_due) > 0 ? 'var(--danger)' : 'var(--success)',
                }}
              >
                <span>Balance Due:</span>
                <span>₹{Number(selectedRepair.balance_due).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsPrintOpen(true);
                }}
              >
                <Printer size={16} /> Print Job Slip
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsDetailOpen(false);
                  setNewStatus(selectedRepair.status);
                  setIsStatusOpen(true);
                }}
              >
                <Edit2 size={16} /> Update Stage
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Job Slip Modal */}
      {selectedRepair && (
        <Modal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`Job Slip: ${selectedRepair.repair_number}`}
          maxWidth="560px"
        >
          <div>
            {/* Printable Container */}
            <div
              id="repair-job-slip"
              style={{
                border: '2px solid #000',
                padding: '20px',
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: '#000',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px',
              }}
            >
              {/* Header: Left Logo, Center Divya Optical Shop, Right S.No */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '12px', gap: '10px' }}>
                <img
                  src={shop?.logo_url || '/logo.png'}
                  alt={shop?.name || 'Divya Optical Shop'}
                  style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '50%', border: '1px solid #ccc' }}
                />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                    {shop?.name || 'Divya Optical Shop'}
                  </h2>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#333' }}>
                    {shop?.address_line1 || ''}{shop?.city ? `, ${shop.city}` : ''} | Ph: {shop?.phone || '+91 9876543210'}
                  </p>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: '#000',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '10px',
                      borderRadius: '3px',
                      marginTop: '2px',
                    }}
                  >
                    REPAIR & SERVICE JOB SLIP
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>Job S.No</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace' }}>#{selectedRepair.repair_number}</div>
                </div>
              </div>

              {/* Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>Job No:</strong> {selectedRepair.repair_number}<br />
                  <strong>Date:</strong> {new Date(selectedRepair.received_date).toLocaleDateString()}<br />
                  <strong>Service:</strong> <span style={{ textTransform: 'uppercase' }}>{selectedRepair.repair_type.replace('_', ' ')}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Customer:</strong> {selectedRepair.customer_name}<br />
                  <strong>Phone:</strong> {selectedRepair.customer_phone || '-'}<br />
                  <strong>Delivery Date:</strong> {selectedRepair.expected_delivery ? new Date(selectedRepair.expected_delivery).toLocaleDateString() : '-'}
                </div>
              </div>

              {/* Item & Problem Details */}
              <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Item:</strong> {selectedRepair.item_description}
                </div>
                <div>
                  <strong>Problem / Instructions:</strong> {selectedRepair.problem_description || 'Standard repair / lens fitting'}
                </div>
              </div>

              {/* Pricing Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px' }}>
                <div>
                  <div>Total Charges: <strong>₹{Number(selectedRepair.total_amount).toFixed(2)}</strong></div>
                  <div>Advance Paid: <strong>₹{Number(selectedRepair.advance_paid).toFixed(2)}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#666' }}>BALANCE DUE:</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>
                    ₹{Number(selectedRepair.balance_due).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div style={{ fontSize: '10px', color: '#555', borderTop: '1px dashed #999', paddingTop: '8px' }}>
                * Please produce this slip at the time of delivery.<br />
                * Goods not claimed within 30 days are not the responsibility of the shop.
              </div>
            </div>

            {/* Print Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsPrintOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print Slip
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
