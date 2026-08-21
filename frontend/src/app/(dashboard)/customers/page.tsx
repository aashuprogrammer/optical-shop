'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Eye,
  ShoppingBag,
  Clock,
  ChevronRight,
  FileText,
  Camera,
  Trash2,
  User as UserIcon,
  Edit,
  Save,
} from 'lucide-react';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [city, setCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [noteText, setNoteText] = useState<string>('');

  // New Customer Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    age: '',
    gender: 'male',
    address_line1: '',
    city: '',
    state: '',
    pin_code: '',
    profile_image_url: '',
    notes: '',
  });

  // Edit Customer Form State
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    age: '',
    gender: 'male',
    address_line1: '',
    city: '',
    state: '',
    pin_code: '',
    profile_image_url: '',
    notes: '',
  });

  const [cameraContext, setCameraContext] = useState<'create' | 'update' | 'edit'>('create');

  const handlePhotoSelected = async (url: string) => {
    if (cameraContext === 'create') {
      setFormData((prev) => ({ ...prev, profile_image_url: url }));
    } else if (cameraContext === 'edit') {
      setEditFormData((prev) => ({ ...prev, profile_image_url: url }));
    } else if (cameraContext === 'update' && customerDetail) {
      const updatedCustomer = {
        ...customerDetail.customer,
        profile_image_url: url,
      };
      const res = await api.updateCustomer(customerDetail.customer.id, updatedCustomer);
      if (res.success) {
        openCustomerDetail(customerDetail.customer.id);
        loadCustomers();
      } else {
        alert(res.error || 'Failed to update customer photo');
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!customerDetail) return;
    if (!confirm('Are you sure you want to remove this customer\'s profile photo?')) return;
    const updatedCustomer = {
      ...customerDetail.customer,
      profile_image_url: '',
    };
    const res = await api.updateCustomer(customerDetail.customer.id, updatedCustomer);
    if (res.success) {
      openCustomerDetail(customerDetail.customer.id);
      loadCustomers();
    } else {
      alert(res.error || 'Failed to remove customer photo');
    }
  };

  const handleOpenEditCustomer = () => {
    if (!customerDetail) return;
    const c = customerDetail.customer;
    const age = calculateAge(c.date_of_birth);
    setEditFormData({
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      phone: c.phone || '',
      email: c.email || '',
      date_of_birth: c.date_of_birth || '',
      age: age.replace(/[^0-9]/g, ''),
      gender: c.gender || 'male',
      address_line1: c.address_line1 || '',
      city: c.city || '',
      state: c.state || '',
      pin_code: c.pin_code || '',
      profile_image_url: c.profile_image_url || '',
      notes: c.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEditAgeChange = (ageVal: string) => {
    setEditFormData((prev) => {
      const numAge = parseInt(ageVal, 10);
      let calculatedDob = prev.date_of_birth;
      if (!isNaN(numAge) && numAge >= 0 && numAge <= 120) {
        const year = new Date().getFullYear() - numAge;
        calculatedDob = `${year}-01-01`;
      }
      return { ...prev, age: ageVal, date_of_birth: calculatedDob };
    });
  };

  const handleEditDobChange = (dobVal: string) => {
    setEditFormData((prev) => {
      let calculatedAge = prev.age;
      if (dobVal) {
        const birthDate = new Date(dobVal);
        if (!isNaN(birthDate.getTime())) {
          const age = new Date().getFullYear() - birthDate.getFullYear();
          calculatedAge = age.toString();
        }
      }
      return { ...prev, date_of_birth: dobVal, age: calculatedAge };
    });
  };

  const handleUpdateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDetail) return;
    const res = await api.updateCustomer(customerDetail.customer.id, editFormData);
    if (res.success) {
      setIsEditOpen(false);
      openCustomerDetail(customerDetail.customer.id);
      loadCustomers();
    } else {
      alert(res.error || 'Failed to update customer');
    }
  };

  useEffect(() => {
    loadCustomers();
    api.getCustomerCities().then((res) => {
      if (res.success && res.data) setCities(res.data);
    });
  }, [search, filter, city]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ search, filter, city });
      if (res.success && res.data) {
        setCustomers(res.data.customers || []);
        setStats(res.data.stats || {});
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: calculate age from DOB
  const calculateAge = (dobString?: string): string => {
    if (!dobString) return '-';
    try {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return '-';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? `${age} yrs` : '<1 yr';
    } catch {
      return '-';
    }
  };

  const handleAgeChange = (ageVal: string) => {
    setFormData((prev) => {
      const numAge = parseInt(ageVal, 10);
      let calculatedDob = prev.date_of_birth;
      if (!isNaN(numAge) && numAge >= 0 && numAge <= 120) {
        const year = new Date().getFullYear() - numAge;
        calculatedDob = `${year}-01-01`;
      }
      return { ...prev, age: ageVal, date_of_birth: calculatedDob };
    });
  };

  const handleDobChange = (dobVal: string) => {
    setFormData((prev) => {
      let calculatedAge = prev.age;
      if (dobVal) {
        const birthDate = new Date(dobVal);
        if (!isNaN(birthDate.getTime())) {
          const age = new Date().getFullYear() - birthDate.getFullYear();
          calculatedAge = age.toString();
        }
      }
      return { ...prev, date_of_birth: dobVal, age: calculatedAge };
    });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createCustomer(formData);
    if (res.success) {
      setIsAddOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        age: '',
        gender: 'male',
        address_line1: '',
        city: '',
        state: '',
        pin_code: '',
        profile_image_url: '',
        notes: '',
      });
      loadCustomers();
    } else {
      alert(res.error || 'Failed to create customer');
    }
  };

  const openCustomerDetail = async (id: number) => {
    setSelectedCustomerId(id);
    const res = await api.getCustomer(id);
    if (res.success && res.data) {
      setCustomerDetail(res.data);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCustomerId || !noteText.trim()) return;
    const res = await api.addCustomerNote(selectedCustomerId, noteText);
    if (res.success) {
      setNoteText('');
      openCustomerDetail(selectedCustomerId);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">
            Manage patient records, live camera profile photos, refraction history, and dues.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <UserPlus size={16} /> New Customer
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid-cols-3" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Total Customers</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{stats.in_book || 0}</div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px' }}><Users size={18} /></div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">New Patients (Last 7 Days)</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--info)' }}>{stats.new_7d || 0}</div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px', backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}><Clock size={18} /></div>
        </div>

        <div className="kpi-card" style={{ padding: '14px' }}>
          <div>
            <span className="kpi-label">Total Outstanding Dues</span>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>₹{Number(stats.total_outstanding || 0).toLocaleString()}</div>
          </div>
          <div className="kpi-icon" style={{ width: '36px', height: '36px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}><ShoppingBag size={18} /></div>
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
            placeholder="Search by customer name, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Customers</option>
          <option value="with_dues">With Outstanding Dues</option>
          <option value="without_dues">No Dues (Paid)</option>
        </select>

        {cities.length > 0 && (
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Customer Data Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>City / Address</th>
              <th style={{ textAlign: 'right' }}>Total Spent</th>
              <th style={{ textAlign: 'right' }}>Outstanding Due</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading customer directory...' : 'No customers found matching search criteria.'}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openCustomerDetail(c.id)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {c.profile_image_url ? (
                          <img
                            src={c.profile_image_url}
                            alt={c.first_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          c.first_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>{c.first_name} {c.last_name || ''}</span>
                        {c.notes && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            {c.notes.slice(0, 30)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {calculateAge(c.date_of_birth)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: c.gender === 'female' ? '#db2777' : c.gender === 'male' ? '#0284c7' : 'var(--text-muted)',
                      }}
                    >
                      {c.gender || 'Other'}
                    </span>
                  </td>
                  <td>
                    {c.phone ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} color="var(--primary)" /> {c.phone}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)' }}>-</span>
                    )}
                  </td>
                  <td>
                    {c.city ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--text-muted)" /> {c.city}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(c.total_spent || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {Number(c.outstanding_dues) > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        ₹{Number(c.outstanding_dues).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: '0.82rem' }}>₹0.00</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomerDetail(c.id);
                      }}
                    >
                      Profile <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Customer">
        <form onSubmit={handleCreateCustomer}>
          {/* Live Camera Photo Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
                overflow: 'hidden',
                border: '2px solid var(--primary-border)',
                flexShrink: 0,
              }}
            >
              {formData.profile_image_url ? (
                <img
                  src={formData.profile_image_url}
                  alt="Customer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={28} />
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                Customer Profile Photo
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCameraContext('create');
                    setIsCameraOpen(true);
                  }}
                >
                  <Camera size={14} /> Live Camera / Upload
                </button>
                {formData.profile_image_url && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setFormData({ ...formData, profile_image_url: '' })}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Mobile Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Age and Gender Inputs */}
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input
                type="number"
                min="0"
                max="120"
                className="form-input"
                placeholder="e.g. 28"
                value={formData.age}
                onChange={(e) => handleAgeChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={formData.date_of_birth}
                onChange={(e) => handleDobChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
            />
          </div>

          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                className="form-input"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical / General Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Any previous eye history, preferred frame styles, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoSelected={handlePhotoSelected}
        title="Take Live Customer Photo"
      />

      {/* Customer Full Profile Detail Modal */}
      {customerDetail && (
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => { setSelectedCustomerId(null); setCustomerDetail(null); }}
          title={`${customerDetail.customer.first_name} ${customerDetail.customer.last_name || ''}`}
          maxWidth="750px"
        >
          <div>
            {/* Customer Header Info with Photo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '18px',
                padding: '12px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {customerDetail.customer.profile_image_url ? (
                  <img
                    src={customerDetail.customer.profile_image_url}
                    alt={customerDetail.customer.first_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  customerDetail.customer.first_name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {customerDetail.customer.first_name} {customerDetail.customer.last_name || ''}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setCameraContext('update');
                        setIsCameraOpen(true);
                      }}
                    >
                      <Camera size={13} /> Update Photo
                    </button>
                    {customerDetail.customer.profile_image_url && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-border, #fca5a5)' }}
                        onClick={handleRemovePhoto}
                        title="Remove customer profile photo"
                      >
                        <Trash2 size={13} /> Remove Photo
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleOpenEditCustomer}
                    >
                      <Edit size={13} /> Edit Customer
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span><strong>Age:</strong> {calculateAge(customerDetail.customer.date_of_birth)}</span>
                  <span style={{ textTransform: 'capitalize' }}><strong>Gender:</strong> {customerDetail.customer.gender || 'Other'}</span>
                  <span><strong>Phone:</strong> {customerDetail.customer.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Orders</span>
                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{customerDetail.metrics?.total_orders || 0}</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Eye Tests</span>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--info)' }}>{customerDetail.metrics?.total_eye_tests || 0}</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Spent</span>
                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{Number(customerDetail.customer.total_spent || 0).toLocaleString()}</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Outstanding Due</span>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: Number(customerDetail.customer.outstanding_dues) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ₹{Number(customerDetail.customer.outstanding_dues || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Prescriptions History Tab Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--primary)" /> Eye Test & Prescription History
              </h3>

              {customerDetail.eye_tests?.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No optical eye tests on record yet.</p>
              ) : (
                customerDetail.eye_tests.map((et: any) => (
                  <div key={et.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span><strong>{et.test_number}</strong></span>
                      <span>{new Date(et.test_date).toLocaleDateString()}</span>
                    </div>
                    <table className="rx-table" style={{ margin: '4px 0' }}>
                      <thead>
                        <tr>
                          <th>Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th><th>PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="eye-label">OD</td>
                          <td>{et.re_sph || '-'}</td><td>{et.re_cyl || '-'}</td><td>{et.re_axis || '-'}</td><td>{et.re_add || '-'}</td><td>{et.re_pd || '-'}</td>
                        </tr>
                        <tr>
                          <td className="eye-label">OS</td>
                          <td>{et.le_sph || '-'}</td><td>{et.le_cyl || '-'}</td><td>{et.le_axis || '-'}</td><td>{et.le_add || '-'}</td><td>{et.le_pd || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* Customer Clinical Notes */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="var(--primary)" /> Doctor & Staff Notes
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add internal patient note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddNote}>
                  Add
                </button>
              </div>

              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {customerDetail.notes?.map((n: any) => (
                  <div key={n.id} style={{ padding: '6px 8px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', marginBottom: '4px', fontSize: '0.8rem' }}>
                    <p>{n.note}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Information"
        maxWidth="620px"
      >
        <form onSubmit={handleUpdateCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Photo & Snapshot Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.4rem',
                overflow: 'hidden',
                border: '2px solid var(--primary-border)',
                flexShrink: 0,
              }}
            >
              {editFormData.profile_image_url ? (
                <img
                  src={editFormData.profile_image_url}
                  alt="Customer Photo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={28} />
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>Customer Profile Photo</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCameraContext('edit');
                    setIsCameraOpen(true);
                  }}
                >
                  <Camera size={14} /> Change Photo
                </button>
                {editFormData.profile_image_url && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-border, #fca5a5)' }}
                    onClick={() => setEditFormData({ ...editFormData, profile_image_url: '' })}
                  >
                    <Trash2 size={13} /> Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={editFormData.first_name}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.last_name}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Mobile Phone *</label>
              <input
                type="tel"
                className="form-input"
                required
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input
                type="number"
                min="0"
                max="120"
                className="form-input"
                value={editFormData.age}
                onChange={(e) => handleEditAgeChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={editFormData.date_of_birth}
                onChange={(e) => handleEditDobChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.address_line1}
                onChange={(e) => setEditFormData({ ...editFormData, address_line1: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
