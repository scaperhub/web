import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ItemCard from '@/components/ItemCard';
import { User, Item, Category } from '@/lib/types';
import { countries } from '@/lib/locations';
import { getProfileUrl } from '@/lib/utils';
import { User as UserIcon, Edit, MapPin, BadgeCheck, UserPlus, UserMinus, X } from 'lucide-react';
import Footer from '@/components/Footer';

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
  onOpenEditProfileSheet?: () => void;
  onLogin?: (user: User, token: string) => void;
}

export default function UserProfile({ user, onLogout, onOpenSellSheet, onOpenEditProfileSheet, onLogin }: ProfileProps) {
  const router = useRouter();
  const { username } = router.query;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Initialize subcategory filter from URL
  useEffect(() => {
    if (router.isReady) {
      if (router.query.subcategory && typeof router.query.subcategory === 'string') {
        setSelectedSubcategory(router.query.subcategory);
      } else {
        setSelectedSubcategory(''); // Explicitly clear if not in URL
      }
    }
  }, [router.isReady, router.query.subcategory]);

  useEffect(() => {
    if (!username || typeof username !== 'string') return;

    // Fetch user by username
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(async data => {
        if (data.user) {
          // Redirect if user type doesn't match route
          if (data.user.userType === 'shop') {
            router.replace(`/shop/${username}`);
            return;
          }
          setProfileUser(data.user);
          // Check if current user is following this profile
          if (user && user.following && user.following.includes(data.user.id)) {
            setIsFollowing(true);
          }
          // Calculate followers count (users who follow this profile user)
          const followersRes = await fetch(`/api/users/${username}/followers`);
          const followersData = await followersRes.json();
          setFollowersCount(followersData.followers?.length || 0);
          // Get following count
          setFollowingCount(data.user.following?.length || 0);
          // Fetch items and categories
          const [itemsRes, categoriesRes] = await Promise.all([
            fetch('/api/items'),
            fetch('/api/categories')
          ]);
          const itemsData = await itemsRes.json();
          const categoriesData = await categoriesRes.json();
          const userItems = itemsData.items?.filter((i: Item) => i.sellerId === data.user.id) || [];
          setItems(userItems);
          setCategories(categoriesData.categories || []);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [username, router]);

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
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
        <div className="text-center py-12">
          <div className="text-xl text-gray-500">User not found</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && profileUser && user.id === profileUser.id;
  const profileUrl = getProfileUrl(profileUser.username, profileUser.userType);
  
  const getCountryName = (code: string) => {
    const country = countries.find(c => c.code === code);
    return country ? country.name : code;
  };

  const handleFollow = async () => {
    if (!user || !profileUser || followLoading) return;
    
    setFollowLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/users/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: profileUser.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(!isFollowing);
        // Update followers count
        const followersRes = await fetch(`/api/users/${username}/followers`);
        const followersData = await followersRes.json();
        setFollowersCount(followersData.followers?.length || 0);
        // Update current user state
        if (data.user && onLogin) {
          onLogin(data.user, token || '');
        }
      }
    } catch (err) {
      console.error('Failed to follow/unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShowFollowers = async () => {
    if (!user || !username || typeof username !== 'string') return;
    setLoadingLists(true);
    setShowFollowersModal(true);
    try {
      const res = await fetch(`/api/users/${username}/followers`);
      const data = await res.json();
      setFollowers(data.followers || []);
    } catch (err) {
      console.error('Failed to load followers');
    } finally {
      setLoadingLists(false);
    }
  };

  const handleShowFollowing = async () => {
    if (!user || !username || typeof username !== 'string') return;
    setLoadingLists(true);
    setShowFollowingModal(true);
    try {
      const res = await fetch(`/api/users/${username}/following`);
      const data = await res.json();
      setFollowing(data.following || []);
    } catch (err) {
      console.error('Failed to load following');
    } finally {
      setLoadingLists(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
                  <div className="flex items-center gap-3">
                    {isOwnProfile ? (
                      <button
                        onClick={onOpenEditProfileSheet}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : user ? (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            : 'bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Follow
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
                
                {profileUser?.bio && (
                  <p className="text-gray-100 text-sm sm:text-base mb-3 leading-relaxed max-w-2xl">
                    {profileUser.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-6 mb-3">
                  <button
                    onClick={user ? handleShowFollowers : undefined}
                    className={`flex items-center gap-2 text-gray-200 text-sm sm:text-base ${user ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="font-semibold">{followersCount}</span>
                    <span>Followers</span>
                  </button>
                  <button
                    onClick={user ? handleShowFollowing : undefined}
                    className={`flex items-center gap-2 text-gray-200 text-sm sm:text-base ${user ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="font-semibold">{followingCount}</span>
                    <span>Following</span>
                  </button>
                </div>
                
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

        {/* Followers/Following Modal */}
        {(showFollowersModal || showFollowingModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showFollowersModal ? 'Followers' : 'Following'}
                </h3>
                <button
                  onClick={() => {
                    setShowFollowersModal(false);
                    setShowFollowingModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadingLists ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (showFollowersModal ? followers : following).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {showFollowersModal ? 'No followers yet' : 'Not following anyone'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(showFollowersModal ? followers : following).map((u: User) => (
                      <Link
                        key={u.id}
                        href={getProfileUrl(u.username, u.userType)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setShowFollowersModal(false);
                          setShowFollowingModal(false);
                        }}
                      >
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">@{u.username}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Listed Items ({items.length})
          </h2>
          
          {/* Subcategory Filters */}
          {(() => {
            // Get all subcategories from all categories
            const allSubcategories = categories.flatMap(cat => 
              cat.subcategories.map(sub => ({ ...sub, categoryName: cat.name }))
            );
            
            // Get subcategory IDs that have items available
            const availableSubcategoryIds = new Set(
              items
                .map(item => item.subcategoryId)
                .filter(id => id) // Filter out empty/null subcategoryIds
            );
            
            // Filter subcategories to only show those with available items
            const availableSubcategories = allSubcategories.filter(sub => 
              availableSubcategoryIds.has(sub.id)
            );
            
            return availableSubcategories.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => {
                    setSelectedSubcategory('');
                    router.push(
                      {
                        pathname: `/user/${username}`,
                        query: {},
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedSubcategory
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubcategory(sub.id);
                      router.push(
                        {
                          pathname: `/user/${username}`,
                          query: { subcategory: sub.id },
                        },
                        undefined,
                        { shallow: true }
                      );
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSubcategory === sub.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            ) : null;
          })()}
        </div>

        {(() => {
          // Filter items by selected subcategory
          const filteredItems = selectedSubcategory
            ? items.filter(item => item.subcategoryId === selectedSubcategory)
            : items;

          return filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-xl text-gray-500">
                {selectedSubcategory ? 'No items in this subcategory' : 'No items listed yet'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
}

