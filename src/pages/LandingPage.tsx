import { Link } from '@/context/RouterContext';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg text-gray-900">VYBE SELECT</span>
          <Link to="/admin/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center py-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Discover. Showcase. Rise.
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
            We're discovering the next generation of DJs. Showcase your sound,
            tell us who you are, and get the opportunity to take your talent to
            the next level.
          </p>
          <Link to="/apply" className="btn-primary text-base">
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-gray-400">VYBE SELECT — DJ Talent Discovery</span>
          <Link to="/admin/login" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Admin Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
