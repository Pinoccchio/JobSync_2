'use client';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import { Card, Container, Input, Button, ImagePreviewModal } from '@/components/ui';
import { ProfilePictureUpload } from '@/components/applicant/ProfilePictureUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Save, Lock, Loader2, User, Mail, Phone, CheckCircle, AlertCircle, Edit as EditIcon, X } from 'lucide-react';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation/profileSchema';
import { formatPhilippinePhone } from '@/lib/utils/phoneFormatter';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  role: string;
  status: string;
}

export default function AccountSettingsPage() {
  const { user, refreshAuth } = useAuth();
  const { showToast } = useToast();

  // Profile form state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Image preview modal state
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Keyboard shortcut: Ctrl+S to save profile (only when editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditingProfile && profileDirty && !profileSaving) {
          const form = document.querySelector('form[aria-label="Update profile information"]') as HTMLFormElement;
          form?.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingProfile, profileDirty, profileSaving]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.profile);
      setProfileForm({
        full_name: data.profile.full_name || '',
        email: data.profile.email || '',
        phone: data.profile.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to load profile',
        'error'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileDirty(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = updateProfileSchema.safeParse(profileForm);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      if (firstError) {
        showToast(firstError, 'error');
      }
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local state
      setProfile(data.profile);
      setProfileDirty(false);
      setIsEditingProfile(false);

      // Refresh auth context to update navbar
      await refreshAuth();

      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update profile',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setPasswordErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordErrors({});

    // Validate form data
    const validation = changePasswordSchema.safeParse(passwordForm);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const errorMap: Record<string, string> = {};
      Object.entries(errors).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          errorMap[key] = messages[0];
        }
      });
      setPasswordErrors(errorMap);
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setPasswordErrors(data.details);
        }
        throw new Error(data.error || 'Failed to change password');
      }

      // Clear form and exit edit mode
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsEditingPassword(false);

      showToast('Password changed successfully!', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to change password',
        'error'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePictureUploadSuccess = async (imageUrl: string) => {
    // Update local state
    if (profile) {
      setProfile({ ...profile, profile_image_url: imageUrl });
    }
    // Refresh auth context to update navbar
    await refreshAuth();
  };

  const handlePictureDeleteSuccess = async () => {
    // Update local state
    if (profile) {
      setProfile({ ...profile, profile_image_url: null });
    }
    // Refresh auth context to update navbar
    await refreshAuth();
  };

  const handleProfileEditClick = () => {
    setIsEditingProfile(true);
  };

  const handleProfileCancelClick = () => {
    // Reset form to original profile values
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
    setProfileDirty(false);
    setIsEditingProfile(false);
  };

  const handlePasswordEditClick = () => {
    setIsEditingPassword(true);
  };

  const handlePasswordCancelClick = () => {
    // Clear password form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setIsEditingPassword(false);
  };

  if (profileLoading) {
    return (
      <AdminLayout
        role="Applicant"
        userName={user?.fullName || 'User'}
        pageTitle="Account Settings"
        pageDescription="Loading..."
      >
        <Container size="lg">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      role="Applicant"
      userName={user?.fullName || 'User'}
      pageTitle="Account Settings"
      pageDescription="Manage your profile information and security settings"
    >
      <Container size="lg">
        <div className="space-y-6" role="main" aria-label="Account settings">
          {/* Profile Information Section */}
          <section aria-labelledby="profile-section">
            <h2 id="profile-section" className="sr-only">Profile Information Section</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Card */}
            <Card
              title="Profile Picture"
              variant="elevated"
              className="lg:col-span-1 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              <div className="py-4">
                <ProfilePictureUpload
                  currentImageUrl={profile?.profile_image_url}
                  userName={profile?.full_name || 'User'}
                  onUploadSuccess={handlePictureUploadSuccess}
                  onDeleteSuccess={handlePictureDeleteSuccess}
                  onPreviewClick={() => setShowImagePreview(true)}
                />
              </div>
            </Card>

            {/* Profile Information Form */}
            <Card
              title="Profile Information"
              variant="elevated"
              className="lg:col-span-2 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              <form
                onSubmit={handleProfileSubmit}
                className="space-y-4"
                aria-label="Update profile information"
              >
                <Input
                  label="Full Name"
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={!isEditingProfile || profileSaving}
                  prefixIcon={User}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={!isEditingProfile || profileSaving}
                  prefixIcon={Mail}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => {
                    const formatted = formatPhilippinePhone(e.target.value);
                    handleProfileChange('phone', formatted);
                  }}
                  placeholder="+63 9XX XXX XXXX"
                  disabled={!isEditingProfile || profileSaving}
                  prefixIcon={Phone}
                />

                <div className="pt-2">
                  <div className="flex items-center justify-end gap-2">
                    {!isEditingProfile ? (
                      <Button
                        type="button"
                        variant="primary"
                        icon={EditIcon}
                        onClick={handleProfileEditClick}
                      >
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={X}
                          onClick={handleProfileCancelClick}
                          disabled={profileSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          icon={Save}
                          loading={profileSaving}
                          disabled={!profileDirty}
                        >
                          {profileSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            </Card>
            </div>
          </section>

          {/* Change Password Section */}
          <section aria-labelledby="password-section">
            <h2 id="password-section" className="sr-only">Password Change Section</h2>
            <Card
              title="Change Password"
              variant="elevated"
              icon={Lock}
              className="transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              {!isEditingPassword ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Click Edit to change your password
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    icon={EditIcon}
                    onClick={handlePasswordEditClick}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 max-w-2xl"
                  aria-label="Change your password"
                >
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={passwordSaving}
                    error={passwordErrors.currentPassword}
                    autoFocus
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter your new password"
                    required
                    disabled={passwordSaving}
                    error={passwordErrors.newPassword}
                  />

                  <div>
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      disabled={passwordSaving}
                      error={passwordErrors.confirmPassword}
                    />
                    {/* Password Matching Feedback */}
                    {passwordForm.newPassword && passwordForm.confirmPassword && (
                      <>
                        {passwordForm.newPassword === passwordForm.confirmPassword ? (
                          <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Passwords match
                          </p>
                        ) : (
                          <p className="mt-1.5 text-sm text-orange-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Passwords don't match
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={X}
                      onClick={handlePasswordCancelClick}
                      disabled={passwordSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Lock}
                      loading={passwordSaving}
                    >
                      {passwordSaving ? 'Changing Password...' : 'Save Password'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </section>
        </div>

      </Container>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={profile?.profile_image_url || null}
        imageName={`${profile?.full_name || 'User'}'s Profile Picture`}
        userName={profile?.full_name || 'User'}
      />
    </AdminLayout>
  );
}
