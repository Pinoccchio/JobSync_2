'use client';
import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  accept?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.pdf',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const file = files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[#22A555] bg-[#D4F4DD]'
            : 'border-gray-300 hover:border-[#22A555]'
        }`}
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
        />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Drag and drop your PDS file here
        </p>
        <p className="text-sm text-gray-500">
          or click to browse your device
        </p>
        {selectedFile && (
          <p className="mt-4 text-sm text-[#22A555] font-medium">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  );
};
