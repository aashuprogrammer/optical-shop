'use client';

import React, { useState, useEffect, useRef } from 'react';

interface WheelPickerProps {
  isOpen: boolean;
  title?: string;
  initialValue?: number | string;
  onSelect: (value: number, formatted: string) => void;
  onClose: () => void;
  allowPlano?: boolean;
}

const SIGNS = ['PLANO', '+', '-'];
const INTEGERS = Array.from({ length: 26 }, (_, i) => i); // 0 to 25
const FRACTIONS = ['.00', '.25', '.50', '.75'];

const ITEM_HEIGHT = 44; // px per item in the wheel
const VISIBLE_COUNT = 5; // 5 visible items, middle one is selected

export const PrescriptionWheelPicker: React.FC<WheelPickerProps> = ({
  isOpen,
  title = 'Swipe Up/Down',
  initialValue = 0,
  onSelect,
  onClose,
  allowPlano = true,
}) => {
  const [selectedSign, setSelectedSign] = useState<string>('+');
  const [selectedInt, setSelectedInt] = useState<number>(0);
  const [selectedFrac, setSelectedFrac] = useState<string>('.00');

  const signColRef = useRef<HTMLDivElement>(null);
  const intColRef = useRef<HTMLDivElement>(null);
  const fracColRef = useRef<HTMLDivElement>(null);

  // Parse initial value on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialValue === 'PLANO' || initialValue === 'plano') {
      setSelectedSign('PLANO');
      setSelectedInt(0);
      setSelectedFrac('.00');
      return;
    }

    const num = typeof initialValue === 'string' ? parseFloat(initialValue) : initialValue;
    if (isNaN(num) || num === 0) {
      setSelectedSign('+');
      setSelectedInt(0);
      setSelectedFrac('.00');
    } else {
      const sign = num < 0 ? '-' : '+';
      const absVal = Math.abs(num);
      const intPart = Math.floor(absVal);
      const fracPart = Math.round((absVal - intPart) * 100);

      let fracStr = '.00';
      if (fracPart >= 63) fracStr = '.75';
      else if (fracPart >= 38) fracStr = '.50';
      else if (fracPart >= 13) fracStr = '.25';

      setSelectedSign(sign);
      setSelectedInt(Math.min(intPart, 25));
      setSelectedFrac(fracStr);
    }
  }, [isOpen, initialValue]);

  // Scroll columns to selected item when opened or changed
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      scrollToIndex(signColRef.current, SIGNS.indexOf(selectedSign));
      scrollToIndex(intColRef.current, INTEGERS.indexOf(selectedInt));
      scrollToIndex(fracColRef.current, FRACTIONS.indexOf(selectedFrac));
    }, 50);
  }, [isOpen]);

  const scrollToIndex = (el: HTMLDivElement | null, index: number) => {
    if (!el || index < 0) return;
    el.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth',
    });
  };

  const handleScroll = (
    el: HTMLDivElement | null,
    items: any[],
    setter: (val: any) => void
  ) => {
    if (!el) return;
    const scrollTop = el.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    setter(items[clampedIndex]);
  };

  const handleConfirm = () => {
    if (selectedSign === 'PLANO') {
      onSelect(0, 'PLANO');
      onClose();
      return;
    }

    const fracVal = parseFloat(selectedFrac);
    const absVal = selectedInt + (isNaN(fracVal) ? 0 : fracVal);
    const finalVal = selectedSign === '-' ? -absVal : absVal;
    const formatted = `${selectedSign}${absVal.toFixed(2)}`;

    onSelect(finalVal, formatted);
    onClose();
  };

  const handleClear = () => {
    onSelect(0, '+0.00');
    onClose();
  };

  if (!isOpen) return null;

  const signsList = allowPlano ? SIGNS : ['+', '-'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: 'fadeInScale 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            padding: '16px 16px 8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            {title}
          </h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginTop: '8px',
              fontSize: '1rem',
              color: '#94a3b8',
            }}
          >
            <span>↓</span>
            <span>↓</span>
            <span>↓</span>
          </div>
        </div>

        {/* Picker Wheels Container */}
        <div
          style={{
            position: 'relative',
            height: `${ITEM_HEIGHT * VISIBLE_COUNT}px`,
            display: 'flex',
            backgroundColor: '#090d16',
            userSelect: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Target Selection Window Guides */}
          <div
            style={{
              position: 'absolute',
              top: `${ITEM_HEIGHT * 2}px`,
              left: '12px',
              right: '12px',
              height: `${ITEM_HEIGHT}px`,
              borderTop: '2px solid rgba(255, 255, 255, 0.8)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              pointerEvents: 'none',
              borderRadius: '6px',
              zIndex: 5,
            }}
          />

          {/* Top & Bottom fade gradients */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${ITEM_HEIGHT * 1.5}px`,
              background: 'linear-gradient(to bottom, #090d16 20%, rgba(9, 13, 22, 0))',
              pointerEvents: 'none',
              zIndex: 6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${ITEM_HEIGHT * 1.5}px`,
              background: 'linear-gradient(to top, #090d16 20%, rgba(9, 13, 22, 0))',
              pointerEvents: 'none',
              zIndex: 6,
            }}
          />

          {/* Column 1: Signs */}
          <div
            ref={signColRef}
            onScroll={() => handleScroll(signColRef.current, signsList, setSelectedSign)}
            style={{
              flex: 1.2,
              height: '100%',
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              scrollbarWidth: 'none',
              paddingTop: `${ITEM_HEIGHT * 2}px`,
              paddingBottom: `${ITEM_HEIGHT * 2}px`,
              textAlign: 'center',
            }}
          >
            {signsList.map((s) => {
              const isSelected = selectedSign === s;
              return (
                <div
                  key={s}
                  onClick={() => {
                    setSelectedSign(s);
                    scrollToIndex(signColRef.current, signsList.indexOf(s));
                  }}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: s === 'PLANO' ? '1rem' : '1.3rem',
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#38bdf8' : '#64748b',
                    cursor: 'pointer',
                    scrollSnapAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s}
                </div>
              );
            })}
          </div>

          {/* Column 2: Integers (0-25) */}
          <div
            ref={intColRef}
            onScroll={() => handleScroll(intColRef.current, INTEGERS, setSelectedInt)}
            style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              scrollbarWidth: 'none',
              paddingTop: `${ITEM_HEIGHT * 2}px`,
              paddingBottom: `${ITEM_HEIGHT * 2}px`,
              textAlign: 'center',
            }}
          >
            {INTEGERS.map((n) => {
              const isSelected = selectedInt === n;
              return (
                <div
                  key={n}
                  onClick={() => {
                    setSelectedInt(n);
                    scrollToIndex(intColRef.current, INTEGERS.indexOf(n));
                  }}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    scrollSnapAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {n}
                </div>
              );
            })}
          </div>

          {/* Column 3: Fractions (.00, .25, .50, .75) */}
          <div
            ref={fracColRef}
            onScroll={() => handleScroll(fracColRef.current, FRACTIONS, setSelectedFrac)}
            style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              scrollbarWidth: 'none',
              paddingTop: `${ITEM_HEIGHT * 2}px`,
              paddingBottom: `${ITEM_HEIGHT * 2}px`,
              textAlign: 'center',
            }}
          >
            {FRACTIONS.map((f) => {
              const isSelected = selectedFrac === f;
              return (
                <div
                  key={f}
                  onClick={() => {
                    setSelectedFrac(f);
                    scrollToIndex(fracColRef.current, FRACTIONS.indexOf(f));
                  }}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    scrollSnapAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Bar */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#0f172a',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Selected Power: </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
            {selectedSign === 'PLANO'
              ? 'PLANO'
              : `${selectedSign}${selectedInt}${selectedFrac}`}
          </span>
        </div>

        {/* Actions Footer */}
        <div
          style={{
            display: 'flex',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0b1120',
          }}
        >
          <button
            type="button"
            onClick={handleClear}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#0284c7',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
