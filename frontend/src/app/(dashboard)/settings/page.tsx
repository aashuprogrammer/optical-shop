'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { api } from '@/lib/api';
import {
  Settings as SettingsIcon,
  Store,
  Users,
  Glasses,
  Eye,
  Camera,
  Save,
  CheckCircle,
  Trash2,
  Edit2,
  Plus,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Shop, User } from '@/lib/types';

const DEFAULT_FRAME_TYPES = [
  '3 PIECE/RIMLESS',
  'HALF RIMLESS/SUPRA',
  'FULL METAL',
  'FULL SHELL/PLASTIC',
  'GOGGLES',
];

const DEFAULT_LENS_FOR_OPTIONS = ['DISTANCE', 'NEAR', 'BIFOCAL', 'PROGRESSIVE'];

const DEFAULT_LENS_TYPE_OPTIONS = [
  'MINERAL LENS',
  'PLASTIC LENS',
  'POLYCARBONATE LENS',
  'TRIVEX LENS',
  'ORGANIC LENS',
  'BLUE CUT',
  'PHOTOCHROMIC',
];

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'customizations' | 'users'>('profile');
  const [customSubTab, setCustomSubTab] = useState<'frame_types' | 'lens_for' | 'lens_type'>('frame_types');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // User Profile Photo
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  // Customization Lists
  const [frameTypes, setFrameTypes] = useState<string[]>(DEFAULT_FRAME_TYPES);
  const [newFrameType, setNewFrameType] = useState<string>('');
  const [editingFrameIdx, setEditingFrameIdx] = useState<number | null>(null);
  const [editingFrameText, setEditingFrameText] = useState<string>('');

  const [lensForList, setLensForList] = useState<string[]>(DEFAULT_LENS_FOR_OPTIONS);
  const [newLensFor, setNewLensFor] = useState<string>('');
  const [editingLensForIdx, setEditingLensForIdx] = useState<number | null>(null);
  const [editingLensForText, setEditingLensForText] = useState<string>('');

  const [lensTypeList, setLensTypeList] = useState<string[]>(DEFAULT_LENS_TYPE_OPTIONS);
  const [newLensType, setNewLensType] = useState<string>('');
  const [editingLensTypeIdx, setEditingLensTypeIdx] = useState<number | null>(null);
  const [editingLensTypeText, setEditingLensTypeText] = useState<string>('');

  // Shop Profile Form
  const [shopForm, setShopForm] = useState({
    name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pin_code: '',
    gstin: '',
    invoice_prefix: 'INV',
    order_prefix: 'ORD',
    currency_symbol: '₹',
    default_tax_rate: 18,
    optometrist_name: '',
    authorized_signatory: '',
    eye_testing_fee: 100,
    terms_and_conditions: '',
  });

  // User Form
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'staff',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Current user from auth / localStorage
    const authRes = await api.me();
    if (authRes.success && authRes.data && authRes.data.user) {
      setCurrentUser(authRes.data.user);
      setProfilePhoto(authRes.data.user.profile_image_url || '');
    } else {
      const stored = localStorage.getItem('optisuite_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setCurrentUser(u);
          setProfilePhoto(u.profile_image_url || '');
        } catch {}
      }
    }

    const [shopRes, usersRes, settingsRes] = await Promise.all([
      api.getShop(),
      api.getUsers(),
      api.getSettings(),
    ]);

    if (shopRes.success && shopRes.data) {
      setShop(shopRes.data);
      const signatory =
        (settingsRes.success && settingsRes.data?.authorized_signatory) ||
        shopRes.data.authorized_signatory ||
        'Divya Maurya';

      setShopForm({
        name: shopRes.data.name || '',
        phone: shopRes.data.phone || '',
        email: shopRes.data.email || '',
        address_line1: shopRes.data.address_line1 || '',
        address_line2: shopRes.data.address_line2 || '',
        city: shopRes.data.city || '',
        state: shopRes.data.state || '',
        pin_code: shopRes.data.pin_code || '',
        gstin: shopRes.data.gstin || '',
        invoice_prefix: shopRes.data.invoice_prefix || 'INV',
        order_prefix: shopRes.data.order_prefix || 'ORD',
        currency_symbol: shopRes.data.currency_symbol || '₹',
        default_tax_rate: Number(shopRes.data.default_tax_rate) || 18,
        optometrist_name: shopRes.data.optometrist_name || '',
        authorized_signatory: signatory,
        eye_testing_fee: Number(shopRes.data.eye_testing_fee) || 100,
        terms_and_conditions: shopRes.data.terms_and_conditions || '',
      });
    }

    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }

    if (settingsRes.success && settingsRes.data) {
      if (settingsRes.data.frame_types) {
        try {
          const parsed = JSON.parse(settingsRes.data.frame_types);
          if (Array.isArray(parsed) && parsed.length > 0) setFrameTypes(parsed);
        } catch {}
      }
      if (settingsRes.data.lens_for_options) {
        try {
          const parsed = JSON.parse(settingsRes.data.lens_for_options);
          if (Array.isArray(parsed) && parsed.length > 0) setLensForList(parsed);
        } catch {}
      }
      if (settingsRes.data.lens_type_options) {
        try {
          const parsed = JSON.parse(settingsRes.data.lens_type_options);
          if (Array.isArray(parsed) && parsed.length > 0) setLensTypeList(parsed);
        } catch {}
      }
    }
  };

  const handleProfilePhotoSave = async (photoUrl: string) => {
    setProfilePhoto(photoUrl);
    const res = await api.updateProfilePhoto(photoUrl);
    if (res.success && res.data) {
      setCurrentUser(res.data);
      localStorage.setItem('optisuite_user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('auth_user_updated'));
      window.dispatchEvent(new Event('user_profile_updated'));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      alert(res.error || 'Failed to update profile photo');
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const [res] = await Promise.all([
      api.updateShop(shopForm),
      api.upsertSetting('authorized_signatory', shopForm.authorized_signatory),
    ]);
    if (res.success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      loadSettings();
    } else {
      alert(res.error || 'Failed to update shop profile');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createUser(userForm);
    if (res.success) {
      setIsAddUserOpen(false);
      setUserForm({ username: '', password: '', full_name: '', email: '', phone: '', role: 'staff' });
      loadSettings();
    } else {
      alert(res.error || 'Failed to create staff account');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff user?')) return;
    const res = await api.deleteUser(id);
    if (res.success) loadSettings();
  };

  // --- Frame Types Handlers ---
  const handleAddFrameType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFrameType.trim().toUpperCase();
    if (!trimmed) return;
    if (frameTypes.includes(trimmed)) {
      alert('This frame type already exists');
      return;
    }
    const updated = [...frameTypes, trimmed];
    setFrameTypes(updated);
    setNewFrameType('');
    await api.upsertSetting('frame_types', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleDeleteFrameType = async (index: number) => {
    const updated = frameTypes.filter((_, i) => i !== index);
    setFrameTypes(updated);
    await api.upsertSetting('frame_types', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleSaveEditFrameType = async (index: number) => {
    const trimmed = editingFrameText.trim().toUpperCase();
    if (!trimmed) return;
    const updated = [...frameTypes];
    updated[index] = trimmed;
    setFrameTypes(updated);
    setEditingFrameIdx(null);
    setEditingFrameText('');
    await api.upsertSetting('frame_types', JSON.stringify(updated));
    showSavedBanner();
  };

  // --- Lens For Handlers ---
  const handleAddLensFor = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLensFor.trim().toUpperCase();
    if (!trimmed) return;
    if (lensForList.includes(trimmed)) {
      alert('This Lens For option already exists');
      return;
    }
    const updated = [...lensForList, trimmed];
    setLensForList(updated);
    setNewLensFor('');
    await api.upsertSetting('lens_for_options', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleDeleteLensFor = async (index: number) => {
    const updated = lensForList.filter((_, i) => i !== index);
    setLensForList(updated);
    await api.upsertSetting('lens_for_options', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleSaveEditLensFor = async (index: number) => {
    const trimmed = editingLensForText.trim().toUpperCase();
    if (!trimmed) return;
    const updated = [...lensForList];
    updated[index] = trimmed;
    setLensForList(updated);
    setEditingLensForIdx(null);
    setEditingLensForText('');
    await api.upsertSetting('lens_for_options', JSON.stringify(updated));
    showSavedBanner();
  };

  // --- Lens Type Handlers ---
  const handleAddLensType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLensType.trim().toUpperCase();
    if (!trimmed) return;
    if (lensTypeList.includes(trimmed)) {
      alert('This Lens Type option already exists');
      return;
    }
    const updated = [...lensTypeList, trimmed];
    setLensTypeList(updated);
    setNewLensType('');
    await api.upsertSetting('lens_type_options', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleDeleteLensType = async (index: number) => {
    const updated = lensTypeList.filter((_, i) => i !== index);
    setLensTypeList(updated);
    await api.upsertSetting('lens_type_options', JSON.stringify(updated));
    showSavedBanner();
  };

  const handleSaveEditLensType = async (index: number) => {
    const trimmed = editingLensTypeText.trim().toUpperCase();
    if (!trimmed) return;
    const updated = [...lensTypeList];
    updated[index] = trimmed;
    setLensTypeList(updated);
    setEditingLensTypeIdx(null);
    setEditingLensTypeText('');
    await api.upsertSetting('lens_type_options', JSON.stringify(updated));
    showSavedBanner();
  };

  const showSavedBanner = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shop Settings & Customizations</h1>
          <p className="page-subtitle">
            Manage store profile, profile photo, custom frame & lens options, and staff accounts.
          </p>
        </div>
        {isSaved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--success)',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: '#ecfdf5',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success)',
            }}
          >
            <CheckCircle size={16} /> Changes saved successfully!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Store size={16} /> Store Profile & Billing Defaults
        </button>
        <button
          className={`tab-btn ${activeTab === 'customizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('customizations')}
        >
          <Glasses size={16} /> Frame & Lens Customizations
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Staff & User Accounts
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STORE PROFILE & USER PROFILE PHOTO */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Profile Photo Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserIcon size={18} color="var(--primary)" />
              User Profile Photo
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.6rem',
                  overflow: 'hidden',
                  border: '3px solid var(--primary-border)',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0,
                }}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="User"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  currentUser?.full_name?.charAt(0).toUpperCase() || <UserIcon size={28} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {currentUser?.full_name || 'Admin User'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
                  Role: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{currentUser?.role || 'Admin'}</span>
                  &nbsp;|&nbsp; Username: <span style={{ fontFamily: 'monospace' }}>{currentUser?.username || 'admin'}</span>
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsCameraOpen(true)}
                  >
                    <Camera size={14} /> Live Camera / Upload Photo
                  </button>
                  {profilePhoto && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleProfilePhotoSave('')}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Store Profile & Billing Defaults Form */}
          <div className="card">
            <form onSubmit={handleUpdateShop}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                Store Identity & Location
              </h3>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Shop / Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shopForm.name}
                    onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.gstin}
                    onChange={(e) => setShopForm({ ...shopForm, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={shopForm.email}
                    onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 1</label>
                <input
                  type="text"
                  className="form-input"
                  value={shopForm.address_line1}
                  onChange={(e) => setShopForm({ ...shopForm, address_line1: e.target.value })}
                />
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.city}
                    onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.state}
                    onChange={(e) => setShopForm({ ...shopForm, state: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.pin_code}
                    onChange={(e) => setShopForm({ ...shopForm, pin_code: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="card-title" style={{ margin: '24px 0 14px' }}>
                Optical Specialist & Invoice Defaults
              </h3>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Consulting Optometrist / Doctor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. A. Sharma (B.Optom)"
                    value={shopForm.optometrist_name}
                    onChange={(e) => setShopForm({ ...shopForm, optometrist_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Eye Examination Fee (₹)</label>
                  <input
                    type="number"
                    step="10"
                    className="form-input"
                    value={shopForm.eye_testing_fee}
                    onChange={(e) => setShopForm({ ...shopForm, eye_testing_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={shopForm.default_tax_rate}
                    onChange={(e) => setShopForm({ ...shopForm, default_tax_rate: parseFloat(e.target.value) || 18 })}
                  />
                </div>
              </div>

              {/* Authorized Signatory Field with Signature Style Preview */}
              <div className="grid-cols-2" style={{ backgroundColor: 'var(--bg-muted)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Authorized Signatory Name</span>
                    <span className="badge badge-ready" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>Receipt Footer</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Divya Maurya / Anurag Maurya"
                    value={shopForm.authorized_signatory}
                    onChange={(e) => setShopForm({ ...shopForm, authorized_signatory: e.target.value })}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    This name will appear on both Customer and Lab Receipts in a professional signature font.
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Signature Font Appearance</label>
                  <div
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px dashed var(--primary-border)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', cursive",
                        fontSize: '1.45rem',
                        fontWeight: 700,
                        color: '#1e3a8a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {shopForm.authorized_signatory || 'Divya Maurya'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Order Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.order_prefix}
                    onChange={(e) => setShopForm({ ...shopForm, order_prefix: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.invoice_prefix}
                    onChange={(e) => setShopForm({ ...shopForm, invoice_prefix: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopForm.currency_symbol}
                    onChange={(e) => setShopForm({ ...shopForm, currency_symbol: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Terms & Conditions (Printed at Invoice Footer)</label>
                <textarea
                  className="form-textarea"
                  value={shopForm.terms_and_conditions}
                  onChange={(e) => setShopForm({ ...shopForm, terms_and_conditions: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Store Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FRAME & LENS CUSTOMIZATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'customizations' && (
        <div className="card">
          <div style={{ marginBottom: '20px' }}>
            <h3 className="card-title">Frame & Lens Customizations</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Customize the dropdown options available when creating New Orders, Eye Checkups, and Inventory items.
            </p>
          </div>

          {/* Sub-tab Pill Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${customSubTab === 'frame_types' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCustomSubTab('frame_types')}
            >
              <Glasses size={15} /> Frame Types ({frameTypes.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${customSubTab === 'lens_for' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCustomSubTab('lens_for')}
            >
              <Eye size={15} /> Lens For Options ({lensForList.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${customSubTab === 'lens_type' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCustomSubTab('lens_type')}
            >
              <Layers size={15} /> Lens Types ({lensTypeList.length})
            </button>
          </div>

          {/* 1. FRAME TYPES */}
          {customSubTab === 'frame_types' && (
            <div>
              <form onSubmit={handleAddFrameType} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ maxWidth: '420px' }}
                  placeholder="Enter new frame type (e.g. TITANIUM, HALF SHELL, etc.)"
                  value={newFrameType}
                  onChange={(e) => setNewFrameType(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Add Frame Type
                </button>
              </form>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Frame Type Name</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frameTypes.map((type, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          {editingFrameIdx === idx ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ maxWidth: '300px' }}
                                value={editingFrameText}
                                onChange={(e) => setEditingFrameText(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEditFrameType(idx)}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingFrameIdx(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <strong style={{ letterSpacing: '0.02em' }}>{type}</strong>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {editingFrameIdx !== idx && (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                title="Edit"
                                onClick={() => {
                                  setEditingFrameIdx(idx);
                                  setEditingFrameText(type);
                                }}
                              >
                                <Edit2 size={15} color="var(--primary)" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ color: 'var(--danger)' }}
                                title="Delete"
                                onClick={() => handleDeleteFrameType(idx)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. LENS FOR OPTIONS */}
          {customSubTab === 'lens_for' && (
            <div>
              <form onSubmit={handleAddLensFor} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ maxWidth: '420px' }}
                  placeholder="Enter new Lens For (e.g. READING, COMPUTER, DRIVING, etc.)"
                  value={newLensFor}
                  onChange={(e) => setNewLensFor(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Add Lens For Option
                </button>
              </form>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Lens For Option</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lensForList.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          {editingLensForIdx === idx ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ maxWidth: '300px' }}
                                value={editingLensForText}
                                onChange={(e) => setEditingLensForText(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEditLensFor(idx)}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingLensForIdx(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <strong style={{ letterSpacing: '0.02em' }}>{item}</strong>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {editingLensForIdx !== idx && (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                title="Edit"
                                onClick={() => {
                                  setEditingLensForIdx(idx);
                                  setEditingLensForText(item);
                                }}
                              >
                                <Edit2 size={15} color="var(--primary)" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ color: 'var(--danger)' }}
                                title="Delete"
                                onClick={() => handleDeleteLensFor(idx)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. LENS TYPE OPTIONS */}
          {customSubTab === 'lens_type' && (
            <div>
              <form onSubmit={handleAddLensType} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ maxWidth: '420px' }}
                  placeholder="Enter new Lens Type (e.g. BLUE CUT, PHOTOCHROMIC, HI-INDEX, etc.)"
                  value={newLensType}
                  onChange={(e) => setNewLensType(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Add Lens Type
                </button>
              </form>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Lens Type Name</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lensTypeList.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          {editingLensTypeIdx === idx ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ maxWidth: '300px' }}
                                value={editingLensTypeText}
                                onChange={(e) => setEditingLensTypeText(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEditLensType(idx)}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingLensTypeIdx(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <strong style={{ letterSpacing: '0.02em' }}>{item}</strong>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {editingLensTypeIdx !== idx && (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                title="Edit"
                                onClick={() => {
                                  setEditingLensTypeIdx(idx);
                                  setEditingLensTypeText(item);
                                }}
                              >
                                <Edit2 size={15} color="var(--primary)" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ color: 'var(--danger)' }}
                                title="Delete"
                                onClick={() => handleDeleteLensType(idx)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF & USER ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddUserOpen(true)}>
              <Plus size={15} /> Add Staff Account
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                          }}
                        >
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt={u.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            u.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <strong>{u.full_name}</strong>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace' }}>{u.username}</span></td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'admin' ? 'badge-ready' : u.role === 'optometrist' ? 'badge-processing' : 'badge-pending'
                        }`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || u.email || '-'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.username !== 'admin' && (
                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Staff User Modal */}
          <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Create Staff Login Account">
            <form onSubmit={handleCreateUser}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Staff Role</label>
                  <select
                    className="form-select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="staff">Shop Staff / Sales Executive</option>
                    <option value="optometrist">Optometrist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Mobile Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* User Profile Photo Camera / Upload Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoSelected={handleProfilePhotoSave}
        title="Update User Profile Photo"
      />
    </div>
  );
}
