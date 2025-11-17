'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image
              src="/JS-logo.png"
              alt="Municipality of Asuncion"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <div className="font-bold text-2xl text-gray-900">JobSync</div>
              <div className="text-xs text-gray-600">Municipality of Asuncion</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-700 hover:text-[#22A555] transition-colors font-medium">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-gray-700 hover:text-[#22A555] transition-colors font-medium">
              How It Works
            </Link>
            <Link href="/#about" className="text-gray-700 hover:text-[#22A555] transition-colors font-medium">
              About
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-[#22A555] transition-colors font-medium">
              Admin Portal
            </Link>
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:flex items-center">
            <Link href="/register">
              <Button variant="success" size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#22A555] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              href="/#features"
              className="block py-2 px-4 text-gray-700 hover:text-[#22A555] hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="block py-2 px-4 text-gray-700 hover:text-[#22A555] hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/#about"
              className="block py-2 px-4 text-gray-700 hover:text-[#22A555] hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/login"
              className="block py-2 px-4 text-gray-700 hover:text-[#22A555] hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Portal
            </Link>
            <div className="pt-2">
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="success" size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
