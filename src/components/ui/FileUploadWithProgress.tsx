'use client';
import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface FileUploadWithProgressProps {
  bucket: 'id-images' | 'announcements' | 'profiles' | 'certificates';
  folder?: string;
  accept?: string;
  onUploadComplete?: (data: {
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  label?: string;
  maxSizeDisplay?: string;
}

export const FileUploadWithProgress: React.FC<FileUploadWithProgressProps> = ({
  bucket,
  folder,
  accept,
  onUploadComplete,
  onUploadError,
  className = '',
  label,
  maxSizeDisplay,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get default label based on bucket
  const getDefaultLabel = () => {
    switch (bucket) {
      case 'id-images':
        return 'Drag and drop your ID image here';
      case 'announcements':
        return 'Drag and drop announcement image here';
      case 'profiles':
        return 'Drag and drop profile picture here';
      case 'certificates':
        return 'Drag and drop certificate file here';
      default:
        return 'Drag and drop file here';
    }
  };

  // Get max size display based on bucket
  const getMaxSize = () => {
    if (maxSizeDisplay) return maxSizeDisplay;
    switch (bucket) {
      case 'id-images':
        return '5MB';
      case 'announcements':
        return '5MB';
      case 'profiles':
        return '2MB';
      case 'certificates':
        return '10MB';
      default:
        return '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');

    // Auto-upload when file is selected
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await fetch('/api/storage', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('success');
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } else {
        setUploadStatus('error');
        setErrorMessage(result.error || 'Upload failed');
        if (onUploadError) {
          onUploadError(result.error || 'Upload failed');
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Upload failed');
      if (onUploadError) {
        onUploadError(error.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (uploadStatus !== 'success' && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#22A555] bg-[#D4F4DD] scale-[1.02]'
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-[#22A555] hover:bg-gray-50'
        } ${uploadStatus === 'success' || uploading ? 'cursor-default' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
          disabled={uploading || uploadStatus === 'success'}
        />

        {/* Upload Icon/Status */}
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-[#22A555] animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}

          {/* Status Text */}
          {uploading ? (
            <div>
              <p className="text-lg font-semibold text-gray-700">Uploading...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while your file is being uploaded</p>
            </div>
          ) : uploadStatus === 'success' ? (
            <div>
              <p className="text-lg font-semibold text-green-700">Upload Successful!</p>
              <p className="text-sm text-green-600 mt-1">{selectedFile?.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="mt-3 px-4 py-2 bg-white border border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                <X className="w-4 h-4" />
                Upload Different File
              </button>
            </div>
          ) : uploadStatus === 'error' ? (
            <div>
              <p className="text-lg font-semibold text-red-700">Upload Failed</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="mt-3 px-4 py-2 bg-white border border-red-500 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-700 mb-1">
                {label || getDefaultLabel()}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse your device
              </p>
              {getMaxSize() && (
                <p className="text-xs text-gray-400 mt-2">
                  Max file size: {getMaxSize()}
                </p>
              )}
            </div>
          )}

          {/* Selected File Name (when idle) */}
          {selectedFile && uploadStatus === 'idle' && !uploading && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <File className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
