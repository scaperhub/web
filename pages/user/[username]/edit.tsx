import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { User } from '@/lib/types';
import { countries, getCitiesForCountry } from '@/lib/locations';
import { getProfileUrl } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProfileEditProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
  onLogin: (user: User, token: string) => void;
}

export default function UserProfileEdit({ user, onLogout, onOpenSellSheet, onLogin }: ProfileEditProps) {
  const router = useRouter();
  const { username } = router.query;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    backgroundPicture: '',
    country: '',
    city: '',
  });

  useEffect(() => {
    if (!username || typeof username !== 'string') return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch current user data
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          // Redirect if user type doesn't match route
          if (data.user.userType === 'shop') {
            router.replace(`/shop/${username}/edit`);
            return;
          }
          // Check if user is editing their own profile
          if (data.user.id !== user.id) {
            router.push(`/user/${username}`);
            return;
          }
          setProfileUser(data.user);
          setFormData({
            name: data.user.name || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
            backgroundPicture: data.user.backgroundPicture || '',
            country: data.user.country || '',
            city: data.user.city || '',
          });
          setLoading(false);
        } else {
          router.push('/');
        }
      })
      .catch(err => {
        console.error(err);
        router.push('/');
      });
  }, [username, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        setSaving(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      onLogin(data.user, token || '');
      const profileUrl = getProfileUrl(data.user.username, data.user.userType);
      setTimeout(() => {
        router.push(profileUrl);
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
        <div className="text-center py-12">
          <div className="text-xl text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  const profileUrl = getProfileUrl(profileUser.username, profileUser.userType);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Profile</h1>
            <button
              onClick={() => router.push(profileUrl)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://example.com/profile.jpg"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              {formData.avatar && (
                <div className="mt-3">
                  <img 
                    src={formData.avatar} 
                    alt="Profile preview" 
                    className="w-24 h-24 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Picture URL
              </label>
              <input
                type="url"
                value={formData.backgroundPicture}
                onChange={e => setFormData({ ...formData, backgroundPicture: e.target.value })}
                placeholder="https://example.com/background.jpg"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              {formData.backgroundPicture && (
                <div className="mt-3">
                  <img 
                    src={formData.backgroundPicture} 
                    alt="Background preview" 
                    className="w-full h-48 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={e => {
                  setFormData({ ...formData, country: e.target.value, city: '' });
                }}
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

            {formData.country && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select a city</option>
                  {getCitiesForCountry(formData.country).map(cityName => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(profileUrl)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

