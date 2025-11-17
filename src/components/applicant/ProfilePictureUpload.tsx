'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { Upload, Trash2, User, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  userName: string;
  onUploadSuccess: (imageUrl: string) => void;
  onDeleteSuccess: () => void;
  onPreviewClick?: () => void;
}

export function ProfilePictureUpload({
  currentImageUrl,
  userName,
  onUploadSuccess,
  onDeleteSuccess,
  onPreviewClick,
}: ProfilePictureUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPEG, PNG, and WebP images are allowed', 'error');
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      showToast('File size must be less than 2MB', 'error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('picture', file);

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile picture');
      }

      showToast('Profile picture uploaded successfully!', 'success');
      setPreviewUrl(null);
      onUploadSuccess(data.imageUrl);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to upload profile picture',
        'error'
      );
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete profile picture');
      }

      showToast('Profile picture removed successfully!', 'success');
      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to delete profile picture',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div
          className={`w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg transition-all duration-200 ${
            displayImage && onPreviewClick
              ? 'cursor-pointer hover:shadow-2xl hover:scale-105 hover:ring-4 hover:ring-teal-400/50'
              : ''
          }`}
          onClick={() => {
            if (displayImage && onPreviewClick) {
              onPreviewClick();
            }
          }}
          role={displayImage && onPreviewClick ? 'button' : undefined}
          tabIndex={displayImage && onPreviewClick ? 0 : undefined}
          aria-label={displayImage && onPreviewClick ? 'Click to preview profile picture' : undefined}
          onKeyDown={(e) => {
            if (displayImage && onPreviewClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onPreviewClick();
            }
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-4xl font-bold">
              {getInitials(userName)}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {(uploading || deleting) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload/Delete Buttons */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="primary"
          size="sm"
          icon={Upload}
          onClick={handleButtonClick}
          disabled={uploading || deleting}
        >
          {uploading ? 'Uploading...' : currentImageUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>

        {currentImageUrl && !uploading && (
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Removing...' : 'Remove'}
          </Button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Supported formats: JPEG, PNG, WebP
        <br />
        Maximum file size: 2MB
      </p>
    </div>
  );
}
