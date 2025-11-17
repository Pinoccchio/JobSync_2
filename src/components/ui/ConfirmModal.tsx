'use client';
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon,
  isLoading = false,
}: ConfirmModalProps) {
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-500" />;
      case 'primary':
      default:
        return <CheckCircle className="w-12 h-12 text-[#22A555]" />;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'danger':
        return 'from-red-50 to-red-100 border-red-200';
      case 'warning':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'info':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'primary':
      default:
        return 'from-green-50 to-green-100 border-green-200';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br ${getVariantColor()} border-2 flex items-center justify-center`}>
          {getIcon()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
