'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { VerdictStatus } from '../types';

interface VerdictBadgeProps {
  status: VerdictStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function VerdictBadge({ status, size = 'md', showIcon = true }: VerdictBadgeProps) {
  const styles = {
    ELIGIBLE: {
      bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
      icon: CheckCircle,
      label: 'ELIGIBLE',
    },
    REVIEW_REQUIRED: {
      bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      icon: AlertTriangle,
      label: 'REVIEW REQUIRED',
    },
    BLOCKED: {
      bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
      icon: XCircle,
      label: 'BLOCKED',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-semibold',
  }[size];

  const Icon = styles.icon;

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wider uppercase font-medium shadow-sm ${styles.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{styles.label}</span>
    </span>
  );
}
