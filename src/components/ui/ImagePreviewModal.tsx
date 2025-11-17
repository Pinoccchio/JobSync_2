'use client';
import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageName?: string;
  userName?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  userName = 'User',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image loaded state when modal opens with new image
  useEffect(() => {
    if (isOpen && imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, imageUrl]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle download
  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName || `${userName}-profile-picture.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      {/* Backdrop with TikTok-style animation */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center max-w-7xl max-h-screen">
        {/* Header - Close & Download Buttons */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6 z-20">
          <h2
            id="image-preview-title"
            className="text-white text-lg sm:text-xl font-semibold drop-shadow-lg"
          >
            {imageName || `${userName}'s Profile Picture`}
          </h2>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              aria-label="Download image"
              title="Download image"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              aria-label="Close preview"
              title="Close preview (ESC)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Image Container with TikTok-style zoom animation */}
        <div
          className="relative flex items-center justify-center w-full h-full animate-zoom-in"
          onClick={onClose}
        >
          {/* Loading Spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Error Message */}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <X className="w-16 h-16 mb-4 text-red-400" />
              <p className="text-lg">Failed to load image</p>
            </div>
          )}

          {/* Actual Image */}
          <img
            src={imageUrl}
            alt={`${userName}'s profile picture`}
            className={`max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          />
        </div>

        {/* Footer - Tap to close hint (mobile) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-center">
          <p className="text-white/70 text-sm sm:text-base drop-shadow-lg">
            Click outside or press ESC to close
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-zoom-in {
          animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};
