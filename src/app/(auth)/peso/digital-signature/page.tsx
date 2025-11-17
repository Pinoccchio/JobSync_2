'use client';
import React, { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import { Card, Button, Container, ModernModal } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import SignatureCanvas from 'react-signature-canvas';
import { User, Pen, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PESODigitalSignaturePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Signature state
  const signatureRef = useRef<SignatureCanvas>(null);
  const [signatureUploadStatus, setSignatureUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearSignatureModalOpen, setClearSignatureModalOpen] = useState(false);

  // Fetch current signature on mount
  useEffect(() => {
    fetchCurrentSignature();
  }, []);

  const fetchCurrentSignature = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/peso/signature');
      const result = await response.json();

      if (response.ok && result.success && result.signatureUrl) {
        setCurrentSignatureUrl(result.signatureUrl);

        // Load signature into canvas if available
        if (result.signatureUrl && signatureRef.current) {
          try {
            // Fetch the image from signed URL
            const imgResponse = await fetch(result.signatureUrl);
            if (imgResponse.ok) {
              const blob = await imgResponse.blob();

              // Convert blob to data URL (base64)
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                if (signatureRef.current && !signatureRef.current.isEmpty()) {
                  // Canvas already has content, don't override
                  return;
                }
                if (signatureRef.current) {
                  signatureRef.current.fromDataURL(base64data);
                }
              };
              reader.readAsDataURL(blob);
            }
          } catch (loadError) {
            console.error('Failed to load signature into canvas:', loadError);
            // Still show preview even if canvas loading fails
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch signature:', error);
      // Silently fail - user might not have signature yet
    } finally {
      setLoading(false);
    }
  };

  // Handle signature drawing end - auto-upload
  const handleSignatureEnd = async () => {
    if (!signatureRef.current) return;

    // Check if canvas is empty
    if (signatureRef.current.isEmpty()) {
      return;
    }

    try {
      setSignatureUploadStatus('uploading');
      setSignatureError(null);

      // Convert canvas to Blob
      const canvas = signatureRef.current.getCanvas();
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
        }, 'image/png', 0.95);
      });

      // Create FormData
      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');

      // Upload to API
      const response = await fetch('/api/peso/signature', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload signature');
      }

      // Re-fetch signature to get signed URL
      await fetchCurrentSignature();
      setSignatureUploadStatus('success');

      showToast('Signature saved successfully!', 'success');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSignatureUploadStatus('idle');
      }, 3000);

    } catch (error: any) {
      console.error('Signature upload error:', error);
      setSignatureError(error.message || 'Failed to upload signature');
      setSignatureUploadStatus('error');
      showToast(getErrorMessage(error), 'error');
    }
  };

  // Clear signature
  const clearSignature = async () => {
    if (!signatureRef.current) return;

    try {
      // Clear the canvas
      signatureRef.current.clear();

      // Delete from storage if exists
      if (currentSignatureUrl) {
        const response = await fetch('/api/peso/signature', {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to delete signature');
        }
      }

      // Clear state
      setCurrentSignatureUrl(null);
      setSignatureUploadStatus('idle');
      setSignatureError(null);

      showToast('Signature cleared successfully', 'success');

    } catch (error: any) {
      console.error('Failed to delete signature:', error);
      showToast(getErrorMessage(error), 'error');

      // Clear canvas anyway
      setCurrentSignatureUrl(null);
    }
  };

  return (
    <AdminLayout
      role="PESO"
      userName={user?.fullName || 'PESO Admin'}
      pageTitle="Digital Signature"
      pageDescription="Manage your digital signature for training certificates"
    >
      <Container>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Digital Signature</h1>
          <p className="mt-2 text-gray-600">
            Manage your digital signature for training certificates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <Card variant="flat" className="lg:col-span-1">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Profile Information</h2>
                <p className="text-sm text-gray-600">Your account details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {user?.email || 'Not available'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-700 font-semibold">PESO Officer</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your digital signature will be used on all training certificates you issue.
                </p>
              </div>
            </div>
          </Card>

          {/* Digital Signature Card */}
          <Card variant="flat" className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Pen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Digital Signature</h2>
                <p className="text-sm text-gray-600">
                  Draw your signature below using your mouse or touchscreen
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading signature...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Instructions:</strong> Draw your signature in the box below. It will be automatically saved
                    and used when you check "Include my digital signature" while issuing certificates.
                  </p>
                </div>

                {/* Signature Canvas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature Canvas
                  </label>
                  <div className="relative">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'w-full h-40 border-2 border-gray-300 rounded-lg bg-white',
                        style: { width: '100%', height: '160px' },
                      }}
                      onEnd={handleSignatureEnd}
                    />

                    {/* Upload Status Indicator */}
                    {signatureUploadStatus === 'uploading' && (
                      <div className="absolute top-2 right-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-700 font-medium">Uploading...</span>
                      </div>
                    )}

                    {signatureUploadStatus === 'success' && (
                      <div className="absolute top-2 right-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Saved</span>
                      </div>
                    )}

                    {signatureUploadStatus === 'error' && signatureError && (
                      <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">Error</span>
                      </div>
                    )}
                  </div>

                  {signatureError && (
                    <p className="mt-2 text-sm text-red-600">{signatureError}</p>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    Draw your signature above. It will be saved automatically when you finish drawing.
                  </p>
                </div>

                {/* Clear Button */}
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setClearSignatureModalOpen(true)}
                    disabled={signatureUploadStatus === 'uploading'}
                  >
                    Clear Signature
                  </Button>
                </div>

                {/* Current Signature Preview */}
                {currentSignatureUrl && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Signature Preview</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center">
                      <div className="relative bg-white p-4 border border-gray-300 rounded shadow-sm">
                        <img
                          src={currentSignatureUrl}
                          alt="Current signature"
                          className="max-w-full h-auto"
                          style={{ maxHeight: '120px' }}
                          onError={(e) => {
                            // If image fails to load (e.g., private bucket), show placeholder
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <p className="text-xs text-gray-500 text-center mt-2">
                          This signature will appear on certificates
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Clear Signature Confirmation Modal */}
        <ModernModal
          isOpen={clearSignatureModalOpen}
          onClose={() => setClearSignatureModalOpen(false)}
          title="Clear Digital Signature"
          subtitle="Confirm signature removal"
          colorVariant="red"
          icon={Trash2}
          size="md"
        >
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 font-semibold mb-2">
                    Are you sure you want to clear your digital signature?
                  </p>
                  <p className="text-sm text-gray-700">
                    This will permanently delete your saved signature from the system.
                    You'll need to draw a new signature if you want to include it on certificates.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Signature Preview (if exists) */}
            {currentSignatureUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Signature
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={currentSignatureUrl}
                    alt="Current signature"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '80px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setClearSignatureModalOpen(false)}
                disabled={signatureUploadStatus === 'uploading'}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={async () => {
                  await clearSignature();
                  setClearSignatureModalOpen(false);
                }}
                loading={signatureUploadStatus === 'uploading'}
              >
                Clear Signature
              </Button>
            </div>
          </div>
        </ModernModal>

        {/* Help Section */}
        <Card variant="flat" className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">How to Use Your Digital Signature</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Draw your signature in the canvas above using your mouse or touchscreen</li>
                <li>It will be automatically saved when you finish drawing</li>
                <li>When issuing training certificates, check the "Include my digital signature" option</li>
                <li>Your signature will appear on the certificate above your printed name</li>
                <li>You can clear and redraw your signature anytime</li>
              </ol>
            </div>
          </div>
        </Card>
      </Container>
    </AdminLayout>
  );
}
