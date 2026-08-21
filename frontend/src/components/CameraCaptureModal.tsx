'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Camera, Upload, RefreshCw, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (imageUrl: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Take Live Photo or Upload',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser or device.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, capturedImage]);

  // Keep video ref srcObject synced
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop square center from video frame
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    try {
      // If captured image is a data URL, convert to Blob/File to attempt server upload
      if (capturedImage.startsWith('data:')) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const uploadRes = await api.uploadFile(file, 'profiles');
        if (uploadRes.success && uploadRes.data?.url) {
          onPhotoSelected(uploadRes.data.url);
        } else {
          // Fallback to data URI directly
          onPhotoSelected(capturedImage);
        }
      } else {
        onPhotoSelected(capturedImage);
      }

      handleClose();
    } catch (e) {
      // Fallback
      onPhotoSelected(capturedImage);
      handleClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Toggle Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '10px' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('camera');
              setCapturedImage(null);
            }}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Camera size={16} /> Live Camera
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Upload size={16} /> Upload File
          </button>
        </div>

        {/* CAMERA MODE */}
        {activeTab === 'camera' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {cameraError ? (
              <div
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  color: 'var(--warning)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Camera Unavailable</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>{cameraError}</div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '10px' }}
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload size={14} /> Switch to File Upload
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    border: '4px solid var(--primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <img
                    src={capturedImage}
                    alt="Captured snapshot"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleRetake}>
                    <RefreshCw size={15} /> Retake Photo
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirm}
                    disabled={isUploading}
                  >
                    <Check size={16} /> {isUploading ? 'Saving...' : 'Use This Photo'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '260px',
                    height: '260px',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    border: '4px solid var(--primary-light)',
                    boxShadow: 'var(--shadow-md)',
                    position: 'relative',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleCapture}
                  style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}
                >
                  <Camera size={18} /> Snap Live Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD FILE MODE */}
        {activeTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {capturedImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '220px',
                    height: '220px',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    border: '4px solid var(--primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <img
                    src={capturedImage}
                    alt="Selected file"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCapturedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <RefreshCw size={15} /> Choose Another
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirm}
                    disabled={isUploading}
                  >
                    <Check size={16} /> {isUploading ? 'Saving...' : 'Apply Photo'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <ImageIcon size={26} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Click to select an image from your device</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Supports JPG, PNG, WEBP files
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
