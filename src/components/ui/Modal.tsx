'use client';

import React, { useEffect } from 'react';
import { Icon } from '@/lib/icons';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, title, onClose, wide = false, children, footer }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div id="modalRoot">
      <div className="veil" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={`modal ${wide ? 'wide' : ''}`}>
          <div className="modal-h">
            <h3>{title}</h3>
            <button className="icobtn" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
          <div className="modal-b">{children}</div>
          {footer && <div className="modal-f">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

interface AskConfirmProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AskConfirmModal({ isOpen, message, onConfirm, onCancel }: AskConfirmProps) {
  if (!isOpen) return null;

  return (
    <div id="modalRoot">
      <div className="veil" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
        <div className="modal" style={{ width: 'min(400px, 100%)' }}>
          <div className="modal-b" style={{ textAlign: 'center', padding: '30px', overflow: 'visible' }}>
            <div style={{ color: 'var(--clay)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <Icon name="alert" size={38} />
            </div>
            <p style={{ font: "600 15px 'Karla', sans-serif", marginBottom: '20px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ background: 'var(--clay)', color: '#fff', borderColor: 'var(--clay)' }}
                onClick={() => {
                  onConfirm();
                }}
              >
                Yes, do it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
