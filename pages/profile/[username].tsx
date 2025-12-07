import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ItemCard from '@/components/ItemCard';
import { User, Item } from '@/lib/types';
import { countries } from '@/lib/locations';
import { User as UserIcon, Edit, MapPin, BadgeCheck } from 'lucide-react';

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Profile({ user, onLogout, onOpenSellSheet }: ProfileProps) {
  const router = useRouter();
  const { username } = router.query;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || typeof username !== 'string') return;

    // Fetch user by username
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(async data => {
        if (data.user) {
          setProfileUser(data.user);
          // Fetch items by seller ID
          const itemsRes = await fetch('/api/items');
          const itemsData = await itemsRes.json();
          const userItems = itemsData.items?.filter((i: Item) => i.sellerId === data.user.id) || [];
          setItems(userItems);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [username]);

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

  const isOwnProfile = user && profileUser && user.id === profileUser.id;
  
  const getCountryName = (code: string) => {
    const country = countries.find(c => c.code === code);
    return country ? country.name : code;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl">
          {/* Background Image */}
          {profileUser?.backgroundPicture ? (
            <div className="relative w-full h-80">
              <img 
                src={profileUser.backgroundPicture} 
                alt="Profile background" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70"></div>
            </div>
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60"></div>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
          )}
          
          {/* Profile Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative -mb-4 sm:mb-0">
                {profileUser?.avatar ? (
                  <div className="relative">
                    <img 
                      src={profileUser.avatar} 
                      alt={profileUser.name} 
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                    <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                    {profileUser?.verified && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 sm:p-2 border-4 border-white shadow-xl">
                        <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-xl">
                    <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-500" />
                    {profileUser?.verified && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 sm:p-2 border-4 border-white shadow-xl">
                        <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-1 drop-shadow-lg">
                      {profileUser?.name || 'Seller'}
                    </h1>
                    <p className="text-gray-200 text-sm sm:text-base font-medium">@{profileUser?.username}</p>
                  </div>
                  {isOwnProfile && (
                    <Link
                      href={`/profile/${username}/edit`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Link>
                  )}
                </div>
                
                {profileUser?.bio && (
                  <p className="text-gray-100 text-sm sm:text-base mb-3 leading-relaxed max-w-2xl">
                    {profileUser.bio}
                  </p>
                )}
                
                {(profileUser?.country || profileUser?.city) && (
                  <div className="flex items-center gap-2 text-gray-200 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>
                      {profileUser.city && profileUser.country && (
                        <>{profileUser.city}, {getCountryName(profileUser.country)}</>
                      )}
                      {!profileUser.city && profileUser.country && (
                        <>{getCountryName(profileUser.country)}</>
                      )}
                      {profileUser.city && !profileUser.country && (
                        <>{profileUser.city}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Listed Items ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-xl text-gray-500">No items listed yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

