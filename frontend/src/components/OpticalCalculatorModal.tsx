'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTranslation } from '../lib/i18n/TranslationContext';
import { api } from '../lib/api';
import { Calculator, ArrowRightLeft, Eye } from 'lucide-react';

interface OpticalCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpticalCalculatorModal: React.FC<OpticalCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'transpose' | 'cl'>('transpose');

  // Transpose state
  const [tSph, setTSph] = useState<number>(0);
  const [tCyl, setTCyl] = useState<number>(0);
  const [tAxis, setTAxis] = useState<number>(90);
  const [tResult, setTResult] = useState<any>(null);

  // CL Convert state
  const [clSph, setClSph] = useState<number>(-4.0);
  const [clCyl, setClCyl] = useState<number>(-1.5);
  const [clAxis, setClAxis] = useState<number>(180);
  const [vertexDist, setVertexDist] = useState<number>(12);
  const [clResult, setClResult] = useState<any>(null);

  const handleTranspose = async () => {
    const res = await api.transpose({ sph: tSph, cyl: tCyl, axis: tAxis });
    if (res.success && res.data) {
      setTResult(res.data);
    }
  };

  const handleCLConvert = async () => {
    const res = await api.convertToCL({
      sph: clSph,
      cyl: clCyl,
      axis: clAxis,
      vertex_distance: vertexDist,
    });
    if (res.success && res.data) {
      setClResult(res.data);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Optical Formulas & Calculations')}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${mode === 'transpose' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('transpose')}
        >
          <ArrowRightLeft size={16} />
          {t('Lens Transposition')}
        </button>
        <button
          className={`btn ${mode === 'cl' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('cl')}
        >
          <Eye size={16} />
          {t('Spectacle to Contact Lens')}
        </button>
      </div>

      {mode === 'transpose' ? (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {t('Convert between Plus (+) and Minus (-) cylinder prescription formats automatically.')}
          </p>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">{t('Sphere (SPH)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={tSph}
                onChange={(e) => setTSph(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Cylinder (CYL)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={tCyl}
                onChange={(e) => setTCyl(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Axis (°)')}</label>
              <input
                type="number"
                min="1"
                max="180"
                className="form-input"
                value={tAxis}
                onChange={(e) => setTAxis(parseInt(e.target.value) || 90)}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleTranspose}>
            <Calculator size={16} /> {t('Calculate Transposition')}
          </button>

          {tResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'var(--primary-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-border)',
              }}
            >
              <h4 style={{ color: 'var(--primary-hover)', marginBottom: '8px' }}>{t('Transposed Rx')}</h4>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                SPH: {tResult.sph > 0 ? `+${tResult.sph.toFixed(2)}` : tResult.sph.toFixed(2)} | CYL:{' '}
                {tResult.cyl > 0 ? `+${tResult.cyl.toFixed(2)}` : tResult.cyl.toFixed(2)} | AXIS: {tResult.axis}°
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('Spherical Equivalent')}: {tResult.spherical_equivalent > 0 ? `+${tResult.spherical_equivalent.toFixed(2)}` : tResult.spherical_equivalent.toFixed(2)} D
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {t('Calculate effective contact lens power compensating for vertex distance (standard 12mm).')}
          </p>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Spectacle SPH (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={clSph}
                onChange={(e) => setClSph(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Spectacle CYL (D)')}</label>
              <input
                type="number"
                step="0.25"
                className="form-input"
                value={clCyl}
                onChange={(e) => setClCyl(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">{t('Axis (°)')}</label>
              <input
                type="number"
                min="1"
                max="180"
                className="form-input"
                value={clAxis}
                onChange={(e) => setClAxis(parseInt(e.target.value) || 180)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Vertex Distance (mm)')}</label>
              <input
                type="number"
                min="8"
                max="16"
                className="form-input"
                value={vertexDist}
                onChange={(e) => setVertexDist(parseFloat(e.target.value) || 12)}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleCLConvert}>
            <Calculator size={16} /> {t('Convert to Contact Lens Power')}
          </button>

          {clResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'var(--success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--success-border)',
              }}
            >
              <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>{t('Recommended Contact Lens Power')}</h4>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                SPH: {clResult.cl_sph > 0 ? `+${clResult.cl_sph.toFixed(2)}` : clResult.cl_sph.toFixed(2)} | CYL:{' '}
                {clResult.cl_cyl > 0 ? `+${clResult.cl_cyl.toFixed(2)}` : clResult.cl_cyl.toFixed(2)} | AXIS: {clResult.cl_axis}°
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('Spherical Equivalent CL')}: {clResult.cl_spherical_equivalent > 0 ? `+${clResult.cl_spherical_equivalent.toFixed(2)}` : clResult.cl_spherical_equivalent.toFixed(2)} D
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
