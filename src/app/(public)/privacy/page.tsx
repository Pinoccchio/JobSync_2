'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative py-12"
      style={{
        backgroundImage: 'url(/municipal.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Green Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#22A555]/90 to-[#1A7F3E]/90"></div>

      {/* Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Privacy Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 text-sm mt-1">JobSync - Municipality of Asuncion, Davao del Norte</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500 italic">
            Last Updated: January 4, 2025
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              The Municipality of Asuncion, Davao del Norte ("the Municipality," "we," "us," or "our") is committed to
              protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains
              how we collect, use, store, and protect your personal data through the JobSync platform ("the System") in
              compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and its implementing
              rules and regulations.
            </p>
            <p className="mt-3">
              By using JobSync, you consent to the data practices described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Data Controller Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Municipal Government of Asuncion</p>
              <p>Human Resources Office</p>
              <p>Asuncion, Davao del Norte, Philippines</p>
              <p className="mt-2">Email: hr@asuncion-davao.gov.ph</p>
              <p>Phone: (084) XXX-XXXX</p>
              <p className="mt-2 text-sm">
                <strong>Data Protection Officer:</strong> [To be appointed]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. What Personal Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide when using JobSync. The types of personal
              information we collect include:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.1 Personal Data Sheet (PDS) Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Personal Information:</strong> Full name, date of birth, place of birth, sex, civil status, height, weight, blood type, citizenship, residential and permanent address, telephone numbers, mobile numbers, email addresses</li>
              <li><strong>Family Background:</strong> Spouse's name and occupation, father's and mother's names, children's names and dates of birth</li>
              <li><strong>Educational Background:</strong> Elementary, secondary, vocational, college, and graduate studies (name of school, degree/course, period of attendance, honors received)</li>
              <li><strong>Civil Service Eligibility:</strong> Eligibility titles, ratings, dates and places of examination</li>
              <li><strong>Work Experience:</strong> Employment history, positions held, salary grades, dates of employment, government service records</li>
              <li><strong>Voluntary Work and Organizations:</strong> Memberships, leadership roles, volunteer activities</li>
              <li><strong>Training and Seminars:</strong> Title of training programs, dates, number of hours, sponsoring organizations</li>
              <li><strong>Skills and Hobbies:</strong> Special skills, non-academic distinctions, hobbies</li>
              <li><strong>Government-Issued IDs:</strong> Copies of valid identification documents</li>
              <li><strong>References:</strong> Names, addresses, and contact information of character references</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.2 Account Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Account role (Applicant, HR, PESO, Admin)</li>
              <li>Account creation date</li>
              <li>Last login timestamp</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.3 Application Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Job positions applied for</li>
              <li>Training programs enrolled in</li>
              <li>Application dates and status</li>
              <li>AI-generated ranking scores and assessments</li>
              <li>HR notes and evaluation comments</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.4 Technical Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Activity logs (login times, page visits, actions performed)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. How We Use Your Personal Information</h2>
            <p>
              We use your personal information for the following lawful purposes:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.1 Primary Purposes</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Recruitment and Hiring:</strong> To evaluate your qualifications for municipal government positions</li>
              <li><strong>AI-Powered Ranking:</strong> To automatically assess and rank applicants using Gemini AI based on objective criteria (education, experience, skills, eligibility)</li>
              <li><strong>Training Program Management:</strong> To process applications for PESO training programs, track attendance, and issue certificates</li>
              <li><strong>Communication:</strong> To send notifications about application status, job postings, training schedules, and system updates</li>
              <li><strong>Account Management:</strong> To create, maintain, and authenticate user accounts</li>
              <li><strong>Compliance:</strong> To comply with civil service rules, government employment regulations, and legal requirements</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.2 Secondary Purposes</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>System Improvement:</strong> To analyze usage patterns and improve the System's functionality</li>
              <li><strong>Security:</strong> To detect and prevent fraud, unauthorized access, and security breaches</li>
              <li><strong>Record Keeping:</strong> To maintain employment records and historical data as required by law</li>
              <li><strong>Reporting:</strong> To generate statistical reports (anonymized) for government agencies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Legal Basis for Processing</h2>
            <p>
              We process your personal information based on the following legal grounds under the Data Privacy Act of 2012:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Consent:</strong> You provide explicit consent when registering and submitting your PDS</li>
              <li><strong>Legal Obligation:</strong> Processing is necessary for compliance with civil service laws and employment regulations</li>
              <li><strong>Legitimate Interest:</strong> Processing is necessary for the Municipality's recruitment and human resources functions</li>
              <li><strong>Public Interest:</strong> Processing is necessary for the performance of public functions and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. How We Share Your Personal Information</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. However, we may share your
              information in the following circumstances:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6.1 Within the Municipality</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>HR Officers:</strong> Access to evaluate applications and manage recruitment</li>
              <li><strong>PESO Officers:</strong> Access to manage training programs and applicant enrollment</li>
              <li><strong>System Administrators:</strong> Access for technical support and maintenance</li>
              <li><strong>Hiring Departments:</strong> Access to view applications relevant to their job postings</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6.2 External Sharing</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Civil Service Commission (CSC):</strong> For verification of eligibility and compliance with civil service rules</li>
              <li><strong>Government Agencies:</strong> When required by law or court order</li>
              <li><strong>Service Providers:</strong> Third-party services for hosting (Vercel), database (Supabase), and AI processing (Google Gemini) under strict data processing agreements</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6.3 Data Processing Agreements</h3>
            <p>
              All third-party service providers are bound by data processing agreements that require them to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process data only for specified purposes</li>
              <li>Implement appropriate security measures</li>
              <li>Not disclose data to other parties</li>
              <li>Delete data upon termination of services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Data Security Measures</h2>
            <p>
              We implement technical, organizational, and physical security measures to protect your personal information:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.1 Technical Measures</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Encryption:</strong> Passwords are hashed using industry-standard encryption (bcrypt)</li>
              <li><strong>Secure Transmission:</strong> All data is transmitted over HTTPS (SSL/TLS encryption)</li>
              <li><strong>Database Security:</strong> Row-Level Security (RLS) policies restrict data access based on user roles</li>
              <li><strong>Authentication:</strong> Secure authentication with session management and token-based verification</li>
              <li><strong>Regular Backups:</strong> Automated daily backups with encryption</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.2 Organizational Measures</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access Control:</strong> Role-based access control (RBAC) limits data access to authorized personnel only</li>
              <li><strong>Activity Logging:</strong> All system activities are logged for audit and security monitoring</li>
              <li><strong>Staff Training:</strong> Regular training on data privacy and security for HR and PESO personnel</li>
              <li><strong>Incident Response:</strong> Procedures for detecting, reporting, and responding to data breaches</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.3 Physical Measures</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Restricted access to server rooms and IT infrastructure</li>
              <li>Secure disposal of physical documents containing personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes for which it was collected
              and to comply with legal requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Active Applications:</strong> Retained while applications are under review or pending</li>
              <li><strong>Hired Employees:</strong> Retained for the duration of employment and as required by civil service rules</li>
              <li><strong>Unsuccessful Applications:</strong> Retained for 3 years for future job opportunities, then archived or deleted</li>
              <li><strong>Training Records:</strong> Retained for 5 years as required by PESO reporting obligations</li>
              <li><strong>Account Data:</strong> Retained until account deletion is requested</li>
              <li><strong>Activity Logs:</strong> Retained for 1 year for security and audit purposes</li>
            </ul>
            <p className="mt-3">
              Upon expiration of retention periods, personal data will be anonymized, archived, or securely deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Your Data Privacy Rights</h2>
            <p>
              Under the Data Privacy Act of 2012, you have the following rights regarding your personal information:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.1 Right to Information</h3>
            <p>
              You have the right to be informed about the collection, use, and disclosure of your personal data.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.2 Right to Access</h3>
            <p>
              You have the right to access your personal data stored in the System. You can view and download your PDS and
              application history through your account dashboard.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.3 Right to Rectification</h3>
            <p>
              You have the right to correct inaccurate or incomplete personal data. You can update your PDS and profile
              information at any time through the System.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.4 Right to Erasure (Right to be Forgotten)</h3>
            <p>
              You have the right to request deletion of your personal data, subject to legal retention requirements.
              To request account deletion, contact our Data Protection Officer.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.5 Right to Object</h3>
            <p>
              You have the right to object to the processing of your personal data for direct marketing or other purposes
              not essential to the System's operation.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.6 Right to Data Portability</h3>
            <p>
              You have the right to receive a copy of your personal data in a structured, commonly used, and machine-readable
              format. You can export your data through the account settings.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.7 Right to File a Complaint</h3>
            <p>
              If you believe your data privacy rights have been violated, you have the right to file a complaint with the
              National Privacy Commission (NPC) of the Philippines.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="font-semibold">National Privacy Commission</p>
              <p>Email: info@privacy.gov.ph</p>
              <p>Website: www.privacy.gov.ph</p>
              <p>Hotline: (02) 8234-2228</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Cookies and Tracking Technologies</h2>
            <p>
              JobSync uses cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for authentication and session management</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Security Cookies:</strong> Detect suspicious activity and prevent fraud</li>
            </ul>
            <p className="mt-3">
              We do not use advertising or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Children's Privacy</h2>
            <p>
              JobSync is not intended for individuals under 18 years of age. We do not knowingly collect personal information
              from minors. If we discover that a minor's data has been collected, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Data Breach Notification</h2>
            <p>
              In the event of a data breach that poses a risk to your rights and freedoms, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Notify the National Privacy Commission within 72 hours of discovering the breach</li>
              <li>Notify affected individuals without undue delay</li>
              <li>Describe the nature of the breach, potential consequences, and mitigation measures</li>
              <li>Provide guidance on protective actions you can take</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Updates to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal
              requirements, or other factors. Updates will be posted on this page with a revised "Last Updated" date.
            </p>
            <p className="mt-3">
              Significant changes will be communicated via email or system notifications. Your continued use of JobSync
              after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">Municipal Government of Asuncion</p>
              <p>Human Resources Office</p>
              <p>Data Protection Officer</p>
              <p className="mt-2">Email: dpo@asuncion-davao.gov.ph</p>
              <p>Phone: (084) XXX-XXXX</p>
              <p className="mt-2 text-sm">
                Office Hours: Monday to Friday, 8:00 AM - 5:00 PM (Philippine Time)
              </p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              By using JobSync, you acknowledge that you have read, understood, and agree to this Privacy Policy and the
              processing of your personal information as described herein.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              icon={ArrowLeft}
              className="w-full"
            >
              Back to Register
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555]"
            >
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
