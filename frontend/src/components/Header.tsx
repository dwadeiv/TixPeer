import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            TixPeer
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/events" className="text-gray-700 hover:text-primary-600 transition-colors">
              Events
            </Link>
            <Link href="/sell" className="text-gray-700 hover:text-primary-600 transition-colors">
              Sell Tickets
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
