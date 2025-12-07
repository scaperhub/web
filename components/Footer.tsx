import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 py-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-semibold text-gray-900 tracking-tight mb-2 inline-block">
              ScaperHub<span className="text-primary-500">.</span>
            </Link>
            <p className="text-sm text-gray-600 max-w-md">
              Your Aquascape Marketplace. Connect with fellow hobbyists and shop owners to buy, sell, and discover the best aquarium equipment.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 self-end">
            <a href="mailto:contact@scaperhub.com" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Contact Us
            </a>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} ScaperHub<span className="text-primary-500">.</span> All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

