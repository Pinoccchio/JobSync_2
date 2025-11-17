'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import Image from 'next/image';
import { Briefcase, GraduationCap, Sparkles, Target, BarChart3, Zap, Bell, FileText, MapPin, Phone, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      // Redirect authenticated users to their role-specific dashboard
      console.log('🏠 Landing page: User authenticated, redirecting to dashboard');
      const dashboardMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        HR: '/hr/dashboard',
        PESO: '/peso/dashboard',
        APPLICANT: '/applicant/dashboard',
      };
      const redirectPath = dashboardMap[role] || '/applicant/dashboard';
      router.push(redirectPath);
    }
  }, [isAuthenticated, role, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#22A555] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page content if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#22A555] via-[#1A7F3E] to-[#22A555] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Content */}
            <div>
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
                Municipality of Asuncion - Davao del Norte
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Find Your Perfect Career Match with <span className="text-[#D4F4DD]">JobSync</span>
              </h1>

              <p className="text-xl lg:text-2xl mb-8 text-white/90 leading-relaxed">
                AI-powered job matching system that analyzes your skills and experience to connect you with the right opportunities
              </p>

              {/* Showcase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-14 h-14 bg-white/20 rounded-lg inline-flex items-center justify-center mb-4">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Municipal Hall Jobs</h3>
                  <p className="text-white/80 text-sm">
                    Browse and apply for government positions at Asuncion Municipal Hall
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-14 h-14 bg-white/20 rounded-lg inline-flex items-center justify-center mb-4">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">PESO Training</h3>
                  <p className="text-white/80 text-sm">
                    Free skills training programs to enhance your employability
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-14 h-14 bg-white/20 rounded-lg inline-flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">AI-Powered Matching</h3>
                  <p className="text-white/80 text-sm">
                    Gemini AI analyzes your profile to match you with the right opportunities
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-4xl font-bold mb-1">Gemini AI</div>
                  <div className="text-sm text-white/80">Powered Matching</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">Instant</div>
                  <div className="text-sm text-white/80">OCR Processing</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">24/7</div>
                  <div className="text-sm text-white/80">System Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#D4F4DD] text-[#1A7F3E] rounded-full text-sm font-semibold mb-4">
              Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              Why Choose JobSync?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced technology meets efficient recruitment for better job matching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gemini AI-Powered Matching</h3>
                <p className="text-gray-600">
                  Our Gemini AI algorithms analyze your PDS and match you with the most suitable positions
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#20C997] to-[#1AB386] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligent Ranking</h3>
                <p className="text-gray-600">
                  Get ranked based on education, experience, skills, and eligibilities using advanced algorithms
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FDB912] to-[#E5A810] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Processing</h3>
                <p className="text-gray-600">
                  OCR technology extracts information from your PDS in seconds for quick processing
                </p>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#DC3545] to-[#C82333] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Updates</h3>
                <p className="text-gray-600">
                  Receive instant notifications about your application status and new opportunities
                </p>
              </div>
            </Card>

            {/* Feature 5 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#6C757D] to-[#495057] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">PDS Management</h3>
                <p className="text-gray-600">
                  Easy upload and management of Personal Data Sheet with downloadable templates
                </p>
              </div>
            </Card>

            {/* Feature 6 */}
            <Card className="text-center hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#22A555] to-[#20C997] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Training Programs</h3>
                <p className="text-gray-600">
                  Access PESO training programs to enhance your skills and improve employability
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 to-[#D4F4DD]/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              How JobSync Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get hired in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#22A555] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-4xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Profile</h3>
              <p className="text-gray-600">
                Upload your Personal Data Sheet (PDS 2025 format) and select your desired position
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-[#20C997] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-4xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our Gemini AI system analyzes your qualifications and ranks you against job requirements
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-[#FDB912] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-4xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Matched</h3>
              <p className="text-gray-600">
                Receive notifications and track your application status in real-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-[#D4F4DD] text-[#1A7F3E] rounded-full text-sm font-semibold mb-4">
                About JobSync
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Serving the Municipality of Asuncion
              </h2>
            </div>

            <Card className="p-10">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  JobSync is an innovative Gemini AI-powered system designed specifically for the Asuncion Municipal Hall
                  to streamline the recruitment process. Our platform uses cutting-edge Gemini AI technology
                  and Optical Character Recognition to match qualified candidates with job opportunities.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The system intelligently scans and ranks Personal Data Sheets (PDS), evaluating candidates based
                  on their educational attainments, eligibilities, skills, and work experience. This ensures fair,
                  transparent, and efficient hiring processes for both the Municipal Hall and PESO programs.
                </p>
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="text-center p-6 bg-[#D4F4DD] rounded-xl">
                    <div className="text-3xl font-bold text-[#22A555] mb-2">Municipal Hall</div>
                    <div className="text-gray-700">Job Opportunities</div>
                  </div>
                  <div className="text-center p-6 bg-[#D4F4DD] rounded-xl">
                    <div className="text-3xl font-bold text-[#22A555] mb-2">PESO</div>
                    <div className="text-gray-700">Training Programs</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-r from-[#22A555] to-[#1A7F3E] text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Visit us or contact the Municipality of Asuncion for inquiries about job opportunities and training programs
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Location */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visit Us</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Municipality of Asuncion<br />
                Davao del Norte<br />
                Philippines
              </p>
            </div>

            {/* Contact */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Contact</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                HR Department<br />
                Phone: (084) XXX-XXXX<br />
                Email: hr@asuncion.gov.ph
              </p>
            </div>

            {/* Hours */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Office Hours</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Monday - Friday<br />
                8:00 AM - 5:00 PM<br />
                (Except Holidays)
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
