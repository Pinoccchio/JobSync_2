'use client';
import React from 'react';
import Link from 'next/link';

interface PublicNavProps {
  showDownloadPDS?: boolean;
}

export const PublicNav: React.FC<PublicNavProps> = ({ showDownloadPDS = false }) => {
  return (
    <nav className="bg-[#22A555] text-white px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-[#22A555] font-bold text-sm">JS</span>
          </div>
          <span className="font-bold text-xl">JOBSYNC</span>
        </Link>

        <div className="flex items-center gap-6">
          {showDownloadPDS && (
            <Link
              href="/download-pds"
              className="text-white hover:text-[#D4F4DD] transition-colors underline"
            >
              Download PDS
            </Link>
          )}
          <Link
            href="/login"
            className="text-white hover:text-[#D4F4DD] transition-colors font-medium"
          >
            Admin Portal
          </Link>
          <Link
            href="/login"
            className="px-6 py-2 bg-white text-[#22A555] rounded-lg font-semibold hover:bg-[#D4F4DD] transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};
