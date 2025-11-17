'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { FileText, Download, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface PDSDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdsId: string;
}

export function PDSDownloadModal({ isOpen, onClose, pdsId }: PDSDownloadModalProps) {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<'csc' | 'modern' | 'excel'>('csc');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [useCurrentDate, setUseCurrentDate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        format: selectedFormat,
        includeSignature: includeSignature.toString(),
        useCurrentDate: useCurrentDate.toString(),
      });

      // Call download API
      const response = await fetch(`/api/pds/${pdsId}/download?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download PDS');
      }

      // Get the file blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on format
      if (selectedFormat === 'excel') {
        // Excel filename from backend Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'PDS_2025.xlsx'; // fallback

        if (contentDisposition) {
          // Use non-greedy regex to avoid capturing quotes
          const match = contentDisposition.match(/filename="([^"]+)"/i);
          if (match && match[1]) {
            filename = match[1];
          }
        }
        link.download = filename;
      } else {
        link.download = `PDS_${selectedFormat === 'csc' ? 'CSC' : 'Modern'}_${new Date().toISOString().split('T')[0]}.pdf`;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close modal after successful download
      showToast(`PDS downloaded successfully as ${selectedFormat === 'excel' ? 'Excel' : 'PDF'}!`, 'success');
      onClose();
    } catch (error) {
      console.error('Error downloading PDS:', error);
      showToast('Failed to download PDS. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Download Personal Data Sheet"
      showFooter={false}
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Format:</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* CSC Format Option */}
            <button
              onClick={() => setSelectedFormat('csc')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'csc'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedFormat === 'csc' ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    selectedFormat === 'csc' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Official CSC Format</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    CS Form 212, Revised 2025
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Box-based layout matching official CSC template
                  </p>
                </div>
                {selectedFormat === 'csc' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
            </button>

            {/* Modern Format Option */}
            <button
              onClick={() => setSelectedFormat('modern')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'modern'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedFormat === 'modern' ? 'bg-blue-500' : 'bg-gray-200'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    selectedFormat === 'modern' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Modern PDF</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    JobSync Layout
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Clean table design
                  </p>
                </div>
                {selectedFormat === 'modern' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
            </button>

            {/* Excel Format Option */}
            <button
              onClick={() => setSelectedFormat('excel')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'excel'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedFormat === 'excel' ? 'bg-teal-500' : 'bg-gray-200'
                }`}>
                  <FileSpreadsheet className={`w-6 h-6 ${
                    selectedFormat === 'excel' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Official Excel 2025</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    CS Form 212 Excel
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Editable CSC format
                  </p>
                </div>
                {selectedFormat === 'excel' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Options (only for PDF formats) */}
        {selectedFormat !== 'excel' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Download Options:</h3>
            <div className="space-y-2">
              {/* Include Signature */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Include Digital Signature</span>
              </label>

              {/* Use Current Date */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCurrentDate}
                  onChange={(e) => setUseCurrentDate(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Use Current Date (instead of PDS date)</span>
              </label>
            </div>
          </div>
        )}

        {/* Format Description */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {selectedFormat === 'csc' ? 'Official CSC PDF Format' : selectedFormat === 'excel' ? 'Official Excel 2025 Format' : 'Modern PDF Format'}
          </h4>
          <p className="text-xs text-gray-600">
            {selectedFormat === 'csc'
              ? 'This format replicates the official CS Form No. 212, Revised 2025 with box-based layout. Recommended for submission to government panels and HR offices requiring CSC compliance.'
              : selectedFormat === 'excel'
              ? 'Downloads the official CS Form No. 212, Revised 2025 as an EMPTY editable Excel template (.xlsx). Fill it out manually in Excel/LibreOffice with complete control over formatting. Guaranteed 100% CSC format compliance. Filename: CS_Form_212_LASTNAME_FIRSTNAME_2025.xlsx'
              : 'This format uses a modern, clean table-based design optimized for readability. Ideal for internal reviews, portfolio purposes, and digital archiving.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${
              selectedFormat === 'excel' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : `Download ${selectedFormat === 'excel' ? 'Excel' : 'PDF'}`}
          </button>
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Info Note */}
        <div className="text-xs text-gray-500 italic">
          <p>Note: The {selectedFormat === 'excel' ? 'Excel file' : 'PDF'} will be generated with the selected format{selectedFormat !== 'excel' ? ' and options' : ''}. Large files may take a few seconds to download.</p>
        </div>
      </div>
    </Modal>
  );
}
