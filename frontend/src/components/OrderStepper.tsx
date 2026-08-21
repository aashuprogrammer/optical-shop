'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/TranslationContext';
import { Check, Clock, Eye, Wrench, PackageCheck, Truck } from 'lucide-react';

interface OrderStepperProps {
  currentStatus: string;
}

const STEPS = [
  { key: 'pending', label: 'Order Booked', icon: Clock },
  { key: 'in_lab', label: 'Lens Ordered / Lab', icon: Eye },
  { key: 'fitting', label: 'Lens Fitting', icon: Wrench },
  { key: 'ready', label: 'Quality Check & Ready', icon: PackageCheck },
  { key: 'delivered', label: 'Delivered to Customer', icon: Truck },
];

export const OrderStepper: React.FC<OrderStepperProps> = ({ currentStatus }) => {
  const { t } = useTranslation();

  const getStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    const index = STEPS.findIndex((s) => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentIndex = getStepIndex(currentStatus);

  if (currentStatus === 'cancelled') {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          textAlign: 'center',
          border: '1px solid var(--danger-border)',
        }}
      >
        {t('This order has been CANCELLED and items returned to stock.')}
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0' }}>
      <div className="stepper-container">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span className="step-label">{t(step.label)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
