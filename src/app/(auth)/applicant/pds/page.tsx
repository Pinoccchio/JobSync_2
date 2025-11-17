'use client';
import { PDSWizard } from '@/components/PDS/PDSWizard';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

export default function PDSPage() {
  const { user } = useAuth();

  return (
    <AdminLayout
      role="Applicant"
      userName={user?.fullName || 'Applicant'}
      pageTitle="Personal Data Sheet"
      pageDescription="CS Form No. 212, Revised 2025"
    >
      <PDSWizard />
    </AdminLayout>
  );
}
