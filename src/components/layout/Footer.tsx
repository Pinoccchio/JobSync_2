import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Mail, Sparkles, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/JS-logo.png"
                alt="Municipality of Asuncion"
                width={32}
                height={32}
                className="rounded"
              />
              <h3 className="font-bold text-lg">JobSync</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Gemini AI-powered job matching system for the Municipality of Asuncion, Davao del Norte
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-[#22A555] rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-[#22A555] rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="mailto:hr@asuncion.gov.ph"
                className="w-9 h-9 bg-gray-800 hover:bg-[#22A555] rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="font-semibold mb-4">For Job Seekers</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Training Programs
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold mb-4">For Employers</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                Municipality of Asuncion
              </li>
              <li className="text-gray-400">
                Davao del Norte
              </li>
              <li className="text-gray-400">
                Philippines
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} JobSync. Municipality of Asuncion. All rights reserved.
            </p>

            {/* Powered by Gemini AI Badge */}
            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555] rounded-lg transition-all group"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Powered by Gemini AI</span>
              <ExternalLink className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
