import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ItemCard from '@/components/ItemCard';
import { Item, User, Category } from '@/lib/types';
import { Search, User as UserIcon, ArrowRight } from 'lucide-react';
import { getProfileUrl } from '@/lib/utils';
import { countries } from '@/lib/locations';
import Footer from '@/components/Footer';

interface HomeProps {
  user: User | null;
  onLogin: (user: User, token: string) => void;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Home({ user, onLogin, onLogout, onOpenSellSheet }: HomeProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [filter, setFilter] = useState<'latest' | 'following'>('latest');
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);

  // Initialize state from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { tab, category, subcategory, search } = router.query;
      
      if (tab === 'following' || tab === 'latest') {
        setFilter(tab);
      } else if (!tab) {
        setFilter('latest');
      }
      
      if (category && typeof category === 'string') {
        setCategoryInput(category);
        setActiveCategory(category);
      } else {
        setCategoryInput('');
        setActiveCategory('');
      }
      
      if (subcategory && typeof subcategory === 'string') {
        setSelectedSubcategory(subcategory);
      } else {
        setSelectedSubcategory('');
      }
      
      if (search && typeof search === 'string') {
        setSearchInput(search);
        setActiveSearchTerm(search);
      } else {
        setSearchInput('');
        setActiveSearchTerm('');
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    Promise.all([
      fetch('/api/items?status=available').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
    ]).then(([itemsData, categoriesData]) => {
      setItems(itemsData.items || []);
      setCategories(categoriesData.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Refresh user data when filter changes to following
  useEffect(() => {
    if (filter === 'following' && user) {
      const token = localStorage.getItem('token');
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            onLogin(data.user, token || '');
          }
        })
        .catch(() => {});
    }
  }, [filter, user, onLogin]);

  // Fetch followed users data when filter is following
  useEffect(() => {
    if (filter === 'following' && user && user.following && user.following.length > 0) {
      fetch('/api/users/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: user.following }),
      })
        .then(res => res.json())
        .then(data => {
          setFollowedUsers(data.users || []);
        })
        .catch(() => {
          setFollowedUsers([]);
        });
    } else {
      setFollowedUsers([]);
    }
  }, [filter, user]);

  // Update URL when filters change
  const updateURL = (updates: {
    tab?: 'latest' | 'following';
    category?: string | null;
    subcategory?: string | null;
    search?: string | null;
  }) => {
    const query: Record<string, string> = {};
    
    // Determine tab - use update value or current state
    const newTab = updates.tab !== undefined ? updates.tab : filter;
    if (newTab && newTab !== 'latest') {
      query.tab = newTab;
    }
    
    // Determine category - use update value or current state
    if (updates.category !== undefined) {
      // Explicitly provided (could be null to clear)
      if (updates.category) {
        query.category = updates.category;
      }
    } else {
      // Not provided, use current state
      if (activeCategory) {
        query.category = activeCategory;
      }
    }
    
    // Determine subcategory - use update value or current state
    if (updates.subcategory !== undefined) {
      // Explicitly provided (could be null/undefined to clear)
      if (updates.subcategory) {
        query.subcategory = updates.subcategory;
      }
      // If updates.subcategory is null/undefined/empty, don't add it to query (clears it)
    } else {
      // Not provided, use current state
      if (selectedSubcategory) {
        query.subcategory = selectedSubcategory;
      }
    }
    
    // Determine search - use update value or current state
    if (updates.search !== undefined) {
      // Explicitly provided (could be null to clear)
      if (updates.search) {
        query.search = updates.search;
      }
    } else {
      // Not provided, use current state
      if (activeSearchTerm) {
        query.search = activeSearchTerm;
      }
    }
    
    // Update state immediately for better UX
    if (updates.tab !== undefined) {
      setFilter(updates.tab);
    }
    if (updates.subcategory !== undefined) {
      setSelectedSubcategory(updates.subcategory || '');
    }
    if (updates.category !== undefined) {
      setCategoryInput(updates.category || '');
      setActiveCategory(updates.category || '');
    }
    if (updates.search !== undefined) {
      setSearchInput(updates.search || '');
      setActiveSearchTerm(updates.search || '');
    }
    
    router.push(
      {
        pathname: '/',
        query,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchInput);
    setActiveCategory(categoryInput);
    setSelectedSubcategory(''); // Reset subcategory filter when searching
    updateURL({
      search: searchInput || null,
      category: categoryInput || null,
      subcategory: null,
    });
  };

  // Get all subcategories from all categories
  const allSubcategories = categories.flatMap(cat => 
    cat.subcategories.map(sub => ({ ...sub, categoryName: cat.name }))
  );

  // First, filter items by tab (Latest or Following) to get available items
  const tabFilteredItems = items.filter(item => {
    // Filter by following if that filter is active
    if (filter === 'following') {
      if (!user || !user.following || user.following.length === 0) {
        return false; // No items if not following anyone
      }
      if (!user.following.includes(item.sellerId)) {
        return false; // Only show items from followed users
      }
    }
    return true;
  });

  // Get subcategory IDs that have items available
  const availableSubcategoryIds = new Set(
    tabFilteredItems
      .map(item => item.subcategoryId)
      .filter(id => id) // Filter out empty/null subcategoryIds
  );

  // Filter subcategories to only show those with available items
  const availableSubcategories = allSubcategories.filter(sub => 
    availableSubcategoryIds.has(sub.id)
  );

  const getCountryName = (code: string) => {
    const country = countries.find(c => c.code === code);
    return country ? country.name : code;
  };

  const filteredItems = items.filter(item => {
    // Filter by following if that filter is active
    if (filter === 'following') {
      if (!user || !user.following || user.following.length === 0) {
        return false; // No items if not following anyone
      }
      if (!user.following.includes(item.sellerId)) {
        return false; // Only show items from followed users
      }
    }

    const matchesCategory = !activeCategory || item.categoryId === activeCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategoryId === selectedSubcategory;
    const matchesSearch =
      !activeSearchTerm ||
      item.title.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(activeSearchTerm.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  }).sort((a, b) => {
    // Sort by latest (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      
      {/* Banner with Search */}
      <div className="relative border-b border-gray-200 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
            animation: 'subtleZoom 20s ease-in-out infinite alternate',
          }}
        />
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/40" style={{ zIndex: 1 }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-24" style={{ zIndex: 3 }}>
          {/* Description */}
          <div className="mb-6 text-left">
            <p className="text-3xl text-white font-medium max-w-2xl">
              Your Aquascape Marketplace.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="text-left">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  className="pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white min-w-[200px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Tabs - Always show when no search/category filter */}
        {!activeSearchTerm && !activeCategory && (
          <div className="mb-8">
            <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
              <button
                onClick={() => {
                  updateURL({ tab: 'latest', subcategory: null });
                }}
                className={`px-1 py-4 font-medium text-sm transition-colors relative ${
                  filter === 'latest'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Latest
                {filter === 'latest' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                )}
              </button>
              <button
                onClick={() => {
                  updateURL({ tab: 'following', subcategory: null });
                }}
                disabled={!user}
                className={`px-1 py-4 font-medium text-sm transition-colors relative ${
                  filter === 'following'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Following
                {filter === 'following' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                )}
              </button>
            </div>
            
            {/* Subcategory Filters - Only show if there are available subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => {
                    updateURL({ subcategory: null });
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
                      updateURL({ subcategory: sub.id });
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
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-24">
            <div className="text-sm text-gray-400">Loading items...</div>
          </div>
        ) : filter === 'following' && !activeSearchTerm && !activeCategory ? (
          // Following view: Show users with their items
          followedUsers.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-base text-gray-400 mb-6">
                {user && user.following && user.following.length > 0 
                  ? 'No items from users you follow' 
                  : 'Start following users to see their items here'}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* First 6 users in scrollable row */}
              {followedUsers.slice(0, 6).map(followedUser => {
                const userItems = filteredItems
                  .filter(item => item.sellerId === followedUser.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                if (userItems.length === 0) return null;

                return (
                  <div key={followedUser.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    {/* User Header */}
                    <Link 
                      href={getProfileUrl(followedUser.username, followedUser.userType)}
                      className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
                    >
                      {followedUser.avatar ? (
                        <img
                          src={followedUser.avatar}
                          alt={followedUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {followedUser.name}
                        </h3>
                        {(followedUser.city || followedUser.country) && (
                          <p className="text-sm text-gray-500">
                            {followedUser.city && followedUser.country && (
                              <>{followedUser.city}, {getCountryName(followedUser.country)}</>
                            )}
                            {!followedUser.city && followedUser.country && (
                              <>{getCountryName(followedUser.country)}</>
                            )}
                            {followedUser.city && !followedUser.country && (
                              <>{followedUser.city}</>
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                    {/* User Items */}
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
                        {userItems.map(item => (
                          <div key={item.id} className="flex-shrink-0 w-64">
                            <ItemCard item={item} />
                          </div>
                        ))}
                        {/* Show All Tile */}
                        <Link 
                          href={getProfileUrl(followedUser.username, followedUser.userType)}
                          className="flex-shrink-0 w-64"
                        >
                          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all cursor-pointer h-full flex flex-col items-center justify-center p-8">
                            <div className="text-center">
                              <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                              <p className="text-base font-semibold text-gray-900">Show all</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Remaining users */}
              {followedUsers.length > 6 && (
                <div className="space-y-8">
                  {followedUsers.slice(6).map(followedUser => {
                    const userItems = filteredItems
                      .filter(item => item.sellerId === followedUser.id)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    
                    if (userItems.length === 0) return null;

                    return (
                      <div key={followedUser.id} className="bg-white rounded-xl border border-gray-200 p-6">
                        {/* User Header */}
                        <Link 
                          href={getProfileUrl(followedUser.username, followedUser.userType)}
                          className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
                        >
                          {followedUser.avatar ? (
                            <img
                              src={followedUser.avatar}
                              alt={followedUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {followedUser.name}
                            </h3>
                            {(followedUser.city || followedUser.country) && (
                              <p className="text-sm text-gray-500">
                                {followedUser.city && followedUser.country && (
                                  <>{followedUser.city}, {getCountryName(followedUser.country)}</>
                                )}
                                {!followedUser.city && followedUser.country && (
                                  <>{getCountryName(followedUser.country)}</>
                                )}
                                {followedUser.city && !followedUser.country && (
                                  <>{followedUser.city}</>
                                )}
                              </p>
                            )}
                          </div>
                        </Link>
                        {/* User Items */}
                        <div className="overflow-x-auto">
                          <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
                            {userItems.map(item => (
                              <div key={item.id} className="flex-shrink-0 w-64">
                                <ItemCard item={item} />
                              </div>
                            ))}
                            {/* Show All Tile */}
                            <Link 
                              href={getProfileUrl(followedUser.username, followedUser.userType)}
                              className="flex-shrink-0 w-64"
                            >
                              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all cursor-pointer h-full flex flex-col items-center justify-center p-8">
                                <div className="text-center">
                                  <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                  <p className="text-base font-semibold text-gray-900">Show all</p>
                                </div>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-base text-gray-400 mb-6">
              {activeSearchTerm || activeCategory 
                ? 'No items found matching your search' 
                : 'No items available yet'}
            </div>
            {user && !activeSearchTerm && !activeCategory && (
              <button
                onClick={onOpenSellSheet}
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                List Your First Item
              </button>
            )}
          </div>
        ) : (
          <>
            {activeSearchTerm || activeCategory ? (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Search Results</h2>
                <p className="text-sm text-gray-500">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available</p>
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

