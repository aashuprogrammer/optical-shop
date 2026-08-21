'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import {
  Glasses,
  Search,
  PlusCircle,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Package,
  Layers,
} from 'lucide-react';
import { Product } from '@/lib/types';

const CATEGORIES = [
  { key: 'all', label: 'All Items' },
  { key: 'frame', label: 'Optical Frames' },
  { key: 'lens', label: 'Lenses (CR/Poly/Hi-Index)' },
  { key: 'contact_lens', label: 'Contact Lenses' },
  { key: 'sunglasses', label: 'Sunglasses' },
  { key: 'accessories', label: 'Accessories & Cases' },
  { key: 'solution', label: 'Lens Solutions' },
  { key: 'service', label: 'Fitting & Services' },
];

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('any');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Inventory count adjustment');

  // New Product Form
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'frame',
    brand: '',
    model: '',
    color: '',
    size: '',
    description: '',
    purchase_price: 0,
    selling_price: 0,
    hsn_code: '9003',
    gst_rate: 18,
    current_stock: 10,
    min_stock_level: 3,
    frame_type: 'full_rim',
    frame_material: 'acetate',
    frame_shape: 'rectangle',
    gender_target: 'unisex',
  });

  useEffect(() => {
    loadProducts();
  }, [category, search, stockFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category,
        search,
        stock: stockFilter,
      });
      if (res.success && res.data) {
        setProducts(res.data.products || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createProduct(formData);
    if (res.success) {
      setIsAddOpen(false);
      loadProducts();
    } else {
      alert(res.error || 'Failed to add product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct || adjustQty === 0) return;

    const res = await api.adjustStock(adjustProduct.id, {
      quantity: adjustQty,
      notes: adjustReason,
    });
    if (res.success) {
      setAdjustProduct(null);
      setAdjustQty(0);
      loadProducts();
    } else {
      alert(res.error || 'Failed to adjust stock');
    }
  };

  return (
    <div>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('Inventory & Optical Stock')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t('Manage spectacle frames, ophthalmic lenses, contact lenses, sunglasses, and accessories.')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <PlusCircle size={16} /> {t('Add New Product')}
        </button>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`btn btn-sm ${category === c.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCategory(c.key)}
          >
            {t(c.label)}
          </button>
        ))}
      </div>

      {/* Search & Stock Filter Bar */}
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
            placeholder={t('Search by product name, SKU, brand, or model...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '170px' }}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="any">{t('All Stock Levels')}</option>
          <option value="in_stock">{t('In Stock Only')}</option>
          <option value="low_stock">{t('Low Stock Alert')}</option>
          <option value="out_of_stock">{t('Out of Stock')}</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Product Name / Brand')}</th>
              <th>{t('Category')}</th>
              <th>{t('SKU / Model')}</th>
              <th style={{ textAlign: 'right' }}>{t('Cost Price')}</th>
              <th style={{ textAlign: 'right' }}>{t('Selling Price')}</th>
              <th style={{ textAlign: 'center' }}>{t('Current Stock')}</th>
              <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {loading ? t('Loading inventory catalog...') : t('No inventory items found matching your filters.')}
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.current_stock <= p.min_stock_level;
                const isOut = p.current_stock <= 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700 }}>{p.name}</span>
                        {p.brand && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--primary-hover)', display: 'block', fontWeight: 600 }}>
                            {p.brand} {p.color ? `• ${p.color}` : ''} {p.size ? `(${p.size})` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                        {p.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {p.sku || p.model || '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      ₹{Number(p.purchase_price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{Number(p.selling_price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          backgroundColor: isOut
                            ? 'var(--danger-bg)'
                            : isLow
                            ? 'var(--warning-bg)'
                            : 'var(--success-bg)',
                          color: isOut
                            ? 'var(--danger)'
                            : isLow
                            ? 'var(--warning)'
                            : 'var(--success)',
                        }}
                      >
                        {isLow && <AlertTriangle size={12} />}
                        {p.current_stock} {t('units')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setAdjustProduct(p); setAdjustQty(0); }}
                      >
                        <ArrowUpDown size={14} /> {t('Adjust Stock')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Product Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('Add Optical Product / Lens')} maxWidth="720px">
        <form onSubmit={handleCreateProduct}>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Item / Product Name')} *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. RayBan Aviator Classic Gold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Category')} *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="frame">{t('Optical Frame')}</option>
                <option value="lens">{t('Ophthalmic Lens')}</option>
                <option value="contact_lens">{t('Contact Lens')}</option>
                <option value="sunglasses">{t('Sunglasses')}</option>
                <option value="accessories">{t('Accessories')}</option>
                <option value="solution">{t('Lens Solution')}</option>
                <option value="service">{t('Service / Lab Fitting')}</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('Brand')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. RayBan, Essilor, Crizal"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Model # / SKU')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. RB3025-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Color / Tint')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Matte Black"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">{t('Purchase Cost (₹)')}</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Selling MRP (₹)')} *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('GST Tax Rate (%)')}</label>
              <select
                className="form-select"
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
              >
                <option value={18}>18% (Frames & Lenses)</option>
                <option value={12}>12% (Contact Lens & Medical)</option>
                <option value={5}>5%</option>
                <option value={0}>0% (Tax Exempted)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('HSN Code')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Opening Stock Count')}</label>
              <input
                type="number"
                className="form-input"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Min Stock Alert Level')}</label>
              <input
                type="number"
                className="form-input"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('Add Product to Catalog')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {adjustProduct && (
        <Modal
          isOpen={!!adjustProduct}
          onClose={() => setAdjustProduct(null)}
          title={`${t('Adjust Stock')}: ${adjustProduct.name}`}
        >
          <form onSubmit={handleAdjustStock}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {t('Current available stock')}: <strong>{adjustProduct.current_stock} {t('units')}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">{t('Quantity Adjustment (+ to Add, - to Deduct)')} *</label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="e.g. +5 or -2"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('New resulting stock')}: {adjustProduct.current_stock + adjustQty} {t('units')}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">{t('Reason / Notes')}</label>
              <input
                type="text"
                className="form-input"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setAdjustProduct(null)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('Save Adjustment')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
