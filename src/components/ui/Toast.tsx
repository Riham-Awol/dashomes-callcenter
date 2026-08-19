'use client';

import React from 'react';
import { Icon } from '@/lib/icons';

export interface ToastMessage {
  id: string;
  msg: string;
  isError?: boolean;
  out?: boolean;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (!toasts.length) return <div id="toastRoot" />;

  return (
    <div id="toastRoot">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.isError ? 'err' : ''} ${t.out ? 'out' : ''}`}>
          <Icon name={t.isError ? 'alert' : 'check'} size={16} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
