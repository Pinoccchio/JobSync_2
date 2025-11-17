'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditionsPage() {
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

      {/* Terms Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
            <p className="text-gray-600 text-sm mt-1">JobSync - Municipality of Asuncion, Davao del Norte</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500 italic">
            Last Updated: January 4, 2025
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the JobSync platform ("the System"), you agree to be bound by these Terms and Conditions.
              JobSync is an official platform operated by the Municipality of Asuncion, Davao del Norte, for the purpose of
              managing job applications and employment opportunities within the municipal government.
            </p>
            <p>
              If you do not agree with any part of these terms, you must not use this System.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>"System"</strong> refers to the JobSync web application and all associated services.</li>
              <li><strong>"User"</strong> refers to any person accessing the System, including applicants, HR personnel, PESO officers, and administrators.</li>
              <li><strong>"Personal Data Sheet (PDS)"</strong> refers to the standardized government form (CS Form No. 212 Revised 2025) used for job applications.</li>
              <li><strong>"Municipality"</strong> refers to the Municipality of Asuncion, Davao del Norte.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts and Registration</h2>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.1 Account Creation</h3>
            <p>
              To access certain features of the System, you must create an account by providing accurate, complete, and current information.
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.2 Account Security</h3>
            <p>You must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Choose a strong password and keep it confidential</li>
              <li>Notify the Municipality immediately of any unauthorized access to your account</li>
              <li>Not share your account with others or allow others to access your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.3 Account Termination</h3>
            <p>
              The Municipality reserves the right to suspend or terminate accounts that violate these Terms and Conditions or
              engage in fraudulent, abusive, or illegal activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Use of the System</h2>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.1 Permitted Uses</h3>
            <p>The System may be used for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Submitting job applications to the Municipality of Asuncion</li>
              <li>Completing and maintaining your Personal Data Sheet (PDS)</li>
              <li>Applying for training programs offered by PESO (Public Employment Service Office)</li>
              <li>Viewing job postings and training opportunities</li>
              <li>Receiving notifications about application status</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.2 Prohibited Activities</h3>
            <p>You must NOT:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide false, misleading, or inaccurate information in your PDS or applications</li>
              <li>Impersonate another person or entity</li>
              <li>Use the System for any unlawful purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the System or other users' accounts</li>
              <li>Interfere with or disrupt the System's operation or security</li>
              <li>Use automated tools (bots, scripts) to access the System</li>
              <li>Upload viruses, malware, or any harmful code</li>
              <li>Scrape, copy, or extract data from the System without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Personal Data Sheet (PDS) Accuracy</h2>
            <p>
              You acknowledge that the Personal Data Sheet is an official government document. Providing false information
              in your PDS constitutes a violation of civil service rules and may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Disqualification from employment consideration</li>
              <li>Termination of employment if already hired</li>
              <li>Civil and criminal liability under Philippine law</li>
              <li>Permanent ban from the System and future municipal employment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Privacy</h2>
            <p>
              Your use of the System is subject to our <Link href="/privacy" className="text-[#22A555] hover:text-[#1A7F3E] font-semibold underline">Privacy Policy</Link>,
              which describes how we collect, use, and protect your personal information in compliance with the
              Data Privacy Act of 2012 (Republic Act No. 10173).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the System, including but not limited to text, graphics, logos,
              images, and software, are the property of the Municipality of Asuncion and are protected by copyright,
              trademark, and other intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, or create derivative works based on the System without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. AI-Powered Ranking System</h2>
            <p>
              JobSync uses artificial intelligence (Gemini AI) to evaluate and rank applicants based on qualifications
              such as education, work experience, skills, and eligibility. You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>AI rankings are automated assessments used to assist HR personnel</li>
              <li>Final hiring decisions are made by human HR officers, not solely by AI</li>
              <li>Rankings are based on objective criteria defined by job requirements</li>
              <li>The Municipality reserves the right to modify ranking algorithms to improve accuracy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The System is provided "as is" and "as available" without warranties of any kind, either express or implied.
              The Municipality does not guarantee that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The System will be uninterrupted, secure, or error-free</li>
              <li>All data will be accurately processed or stored</li>
              <li>Defects will be corrected immediately</li>
            </ul>
            <p className="mt-3">
              While we strive to maintain the System's availability, we are not liable for temporary disruptions,
              maintenance, or technical issues beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, the Municipality of Asuncion shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the System, including but not
              limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Loss of data or information</li>
              <li>Unauthorized access to your account</li>
              <li>System downtime or unavailability</li>
              <li>Decisions made based on AI rankings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>
              The Municipality reserves the right to modify these Terms and Conditions at any time. Changes will be
              effective immediately upon posting to the System. Your continued use of the System after changes are posted
              constitutes acceptance of the updated terms.
            </p>
            <p className="mt-3">
              We encourage you to review these Terms and Conditions periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws of the Republic of the Philippines.
              Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Davao del Norte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact Information</h2>
            <p>
              For questions, concerns, or support regarding these Terms and Conditions or the JobSync System, please contact:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">Municipal Government of Asuncion</p>
              <p>Human Resources Office</p>
              <p>Asuncion, Davao del Norte, Philippines</p>
              <p className="mt-2">Email: hr@asuncion-davao.gov.ph</p>
              <p>Phone: (084) XXX-XXXX</p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              By clicking "I Accept" during registration or by continuing to use the System, you acknowledge that you have
              read, understood, and agree to be bound by these Terms and Conditions.
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
