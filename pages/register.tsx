import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User } from '@/lib/types';
import { countries, citiesByCountry, getCitiesForCountry } from '@/lib/locations';

interface RegisterProps {
  user: User | null;
  onLogin: (user: User, token: string) => void;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Register({ user, onLogin, onLogout, onOpenSellSheet }: RegisterProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState<'hobbyist' | 'shop'>('hobbyist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push('/');
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, userType, email, password, country, city }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess('Registration successful! Check your email for the OTP code.');
      setStep('verify');
      setLoading(false);
      
      // In development/localhost, try to fetch and display OTP
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        setTimeout(async () => {
          try {
            const otpRes = await fetch('/api/auth/get-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            const otpData = await otpRes.json();
            if (otpData.code) {
              setSuccess(`Registration successful! Your OTP code is: ${otpData.code} (Development mode)`);
              console.log('🔑 OTP Code for', email, ':', otpData.code);
            }
          } catch (err) {
            // Silently fail - OTP retrieval is optional
            console.log('💡 Tip: You can get your OTP by calling /api/auth/get-otp with your email');
          }
        }, 1000);
      } else {
        // In production, show message about getting OTP
        console.log('💡 OTP has been generated. Check your email or use /api/auth/get-otp endpoint to retrieve it.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
        setLoading(false);
        return;
      }

      setSuccess('Email verified successfully! Your account is pending admin approval. You will be notified once approved.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP');
        setLoading(false);
        return;
      }

      setSuccess('OTP has been resent to your email.');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="max-w-md mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Create account
          </h1>
          <p className="text-sm text-gray-500">
            Sign up to start listing and buying items
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}
          {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                placeholder="username_123"
                pattern="[a-z0-9_]{3,20}"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">3-20 characters, lowercase letters, numbers, and underscores only</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('hobbyist')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                    userType === 'hobbyist'
                      ? 'border-gray-900 bg-gray-50 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Hobbyist
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('shop')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                    userType === 'shop'
                      ? 'border-gray-900 bg-gray-50 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Shop Owner
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={e => {
                  setCountry(e.target.value);
                  setCity(''); // Reset city when country changes
                }}
                required
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
              >
                <option value="">Select a country</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {country && (
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select a city</option>
                  {getCitiesForCountry(country).map(cityName => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit OTP code to <strong>{email}</strong>. Please enter it below to verify your email.
              </p>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-center text-2xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-gray-600 py-2 text-sm font-medium hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              Resend OTP
            </button>
          </form>
          )}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

