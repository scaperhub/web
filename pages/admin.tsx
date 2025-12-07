import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { Category, User, Item } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Trash2, Edit, Users, CheckCircle, XCircle, X, Package, LayoutDashboard, TrendingUp, Tags, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface AdminProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

type Tab = 'dashboard' | 'categories' | 'users' | 'items';
type ViewMode = 'list' | 'create' | 'edit';

export default function Admin({ user, onLogout, onOpenSellSheet }: AdminProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subcategories: [] as { name: string; description?: string; id?: string }[],
  });
  const [newSubcategory, setNewSubcategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadCategories();
    loadUsers();
    loadItems();
  }, [user, router]);

  const loadCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []));
  };

  const loadUsers = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  };

  const loadItems = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/items', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setItems(data.items || []));
  };

  const handleUserStatusChange = async (userId: string, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, status }),
      });

      if (res.ok) {
        loadUsers();
        // Update selected user if it's the one being changed
        if (selectedUser && selectedUser.id === userId) {
          const data = await res.json();
          setSelectedUser(data.user);
        }
      }
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleVerifiedToggle = async (userId: string, verified: boolean) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, verified }),
      });

      if (res.ok) {
        loadUsers();
        // Update selected user if it's the one being changed
        if (selectedUser && selectedUser.id === userId) {
          const data = await res.json();
          setSelectedUser(data.user);
        }
      }
    } catch (err) {
      alert('Failed to update verified status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const url = selectedCategory
        ? `/api/categories/${selectedCategory.id}`
        : '/api/categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save category');
        setLoading(false);
        return;
      }

      loadCategories();
      resetForm();
      setActiveTab('categories');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setViewMode('list');
    setSelectedCategory(null);
    setSelectedUser(null);
    setSelectedItem(null);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', subcategories: [] });
    setNewSubcategory({ name: '', description: '' });
    setSelectedCategory(null);
    setViewMode('list');
    setError('');
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      subcategories: category.subcategories.map(sub => ({
        name: sub.name,
        description: sub.description,
        id: sub.id,
      })),
    });
    setViewMode('edit');
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('edit');
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleItemApprovalChange = async (itemId: string, approvalStatus: 'approved' | 'rejected') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, approvalStatus }),
      });

      if (res.ok) {
        loadItems();
        // Update selected item if it's the one being changed
        if (selectedItem && selectedItem.id === itemId) {
          const data = await res.json();
          setSelectedItem(data.item);
        }
      }
    } catch (err) {
      alert('Failed to update item approval status');
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', subcategories: [] });
    setNewSubcategory({ name: '', description: '' });
    setViewMode('create');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        loadCategories();
      }
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const addSubcategory = () => {
    if (newSubcategory.name.trim()) {
      setFormData({
        ...formData,
        subcategories: [...formData.subcategories, { ...newSubcategory }],
      });
      setNewSubcategory({ name: '', description: '' });
    }
  };

  const removeSubcategory = (index: number) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index),
    });
  };

  const moveSubcategory = (index: number, direction: 'up' | 'down') => {
    const newSubcategories = [...formData.subcategories];
    if (direction === 'up' && index > 0) {
      [newSubcategories[index - 1], newSubcategories[index]] = [newSubcategories[index], newSubcategories[index - 1]];
    } else if (direction === 'down' && index < newSubcategories.length - 1) {
      [newSubcategories[index], newSubcategories[index + 1]] = [newSubcategories[index + 1], newSubcategories[index]];
    }
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const editSubcategory = (index: number) => {
    const sub = formData.subcategories[index];
    setNewSubcategory({ name: sub.name, description: sub.description || '' });
    removeSubcategory(index);
  };

  const updateSubcategory = (index: number, updates: { name?: string; description?: string }) => {
    const newSubcategories = [...formData.subcategories];
    newSubcategories[index] = { ...newSubcategories[index], ...updates };
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  if (!user || user.role !== 'admin') return null;

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  const pendingItems = items.filter(i => i.approvalStatus === 'pending');
  const approvedItems = items.filter(i => i.approvalStatus === 'approved');
  const rejectedItems = items.filter(i => i.approvalStatus === 'rejected');

  // Dashboard statistics
  const totalUsers = users.length;
  const totalItems = items.length;
  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);
  const verifiedUsers = users.filter(u => u.verified).length;
  const availableItems = items.filter(i => i.status === 'available').length;
  const soldItems = items.filter(i => i.status === 'sold').length;
  
  // Recent items (last 5)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  // Recent users (last 5)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Navigation */}
          <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-80px)]">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    activeTab === 'dashboard'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Dashboard</span>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    activeTab === 'users'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Users</span>
                  {pendingUsers.length > 0 && (
                    <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      {pendingUsers.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('categories')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    activeTab === 'categories'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Tags className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Categories</span>
                </button>
                <button
                  onClick={() => handleTabChange('items')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    activeTab === 'items'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Items</span>
                  {pendingItems.length > 0 && (
                    <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      {pendingItems.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-sm text-gray-500">Overview of your marketplace</p>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-semibold text-gray-900">{totalUsers}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {approvedUsers.length} approved, {pendingUsers.length} pending
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-semibold text-gray-900">{totalItems}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {approvedItems.length} approved, {pendingItems.length} pending
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Categories</h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-semibold text-gray-900">{totalCategories}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {totalSubcategories} subcategories
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Verified Users</h3>
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-semibold text-gray-900">{verifiedUsers}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0}% of total
                  </div>
                </div>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Users Status */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Users Status</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-gray-700">Pending</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{pendingUsers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">Approved</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{approvedUsers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-700">Rejected</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{rejectedUsers.length}</span>
                    </div>
                  </div>
                </div>

                {/* Items Status */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Status</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-gray-700">Pending Approval</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{pendingItems.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">Approved</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{approvedItems.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-700">Rejected</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{rejectedItems.length}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-700">Available</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{availableItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="text-sm text-gray-700">Sold</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{soldItems}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Items */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Items</h2>
                    <button
                      onClick={() => handleTabChange('items')}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentItems.length === 0 ? (
                      <p className="text-sm text-gray-500">No items yet</p>
                    ) : (
                      recentItems.map(item => {
                        const seller = users.find(u => u.id === item.sellerId);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">
                                {seller?.name || 'Unknown'} • {formatPrice(item.price)}
                              </p>
                            </div>
                            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                              item.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              item.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.approvalStatus}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
                    <button
                      onClick={() => handleTabChange('users')}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">No users yet</p>
                    ) : (
                      recentUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500">@{u.username}</p>
                            </div>
                          </div>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                            u.status === 'approved' ? 'bg-green-100 text-green-700' :
                            u.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {u.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">User Management</h1>
                <p className="text-sm text-gray-500">Manage user accounts and approvals</p>
              </div>

              {/* User Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-yellow-900">{pendingUsers.length}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-green-900">{approvedUsers.length}</div>
                  <div className="text-sm text-green-700">Approved</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-red-900">{rejectedUsers.length}</div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified Badge</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.status === 'approved' ? 'bg-green-100 text-green-700' :
                            u.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {u.emailVerified ? (
                            <span className="text-green-600">✓ Verified</span>
                          ) : (
                            <span className="text-gray-400">Not verified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleVerifiedToggle(u.id, !u.verified)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              u.verified
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {u.verified ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified
                              </>
                            ) : (
                              'Not Verified'
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUserStatusChange(u.id, 'approved')}
                                className="text-green-600 hover:text-green-900 inline-flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleUserStatusChange(u.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">Categories</h1>
                  <p className="text-sm text-gray-500">Manage product categories and subcategories</p>
                </div>
                <button
                  onClick={handleCreateCategory}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </button>
              </div>

              {/* Category Form View */}
              {(viewMode === 'create' || viewMode === 'edit') && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {viewMode === 'edit' ? 'Edit Category' : 'Create Category'}
                    </h2>
                    <button
                      onClick={resetForm}
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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name *
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
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategories
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newSubcategory.name}
                          onChange={e => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                          placeholder="Subcategory name"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        />
                        <input
                          type="text"
                          value={newSubcategory.description}
                          onChange={e => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={addSubcategory}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {formData.subcategories.length > 0 && (
                        <div className="space-y-2">
                          {formData.subcategories.map((sub, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg group">
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveSubcategory(index, 'up')}
                                  disabled={index === 0}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSubcategory(index, 'down')}
                                  disabled={index === formData.subcategories.length - 1}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                {sub.id ? (
                                  // Existing subcategory - show editable fields
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={sub.name}
                                      onChange={e => updateSubcategory(index, { name: e.target.value })}
                                      className="w-full px-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                                      placeholder="Subcategory name"
                                    />
                                    <input
                                      type="text"
                                      value={sub.description || ''}
                                      onChange={e => updateSubcategory(index, { description: e.target.value })}
                                      className="w-full px-2 py-1 text-sm text-gray-600 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                                      placeholder="Description (optional)"
                                    />
                                  </div>
                                ) : (
                                  // New subcategory - show as text
                                  <div>
                                    <span className="font-medium text-gray-900">{sub.name}</span>
                                    {sub.description && (
                                      <span className="text-gray-600 ml-2">- {sub.description}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!sub.id && (
                                  <button
                                    type="button"
                                    onClick={() => editSubcategory(index)}
                                    className="text-gray-600 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeSubcategory(index)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : viewMode === 'edit' ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Categories Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcategories</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map(category => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-500">{category.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {category.subcategories.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {category.subcategories.map(sub => (
                                  <li key={sub.id}>{sub.name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-400">No subcategories</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No categories yet. Create your first category!
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'items' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Item Management</h1>
                <p className="text-sm text-gray-500">Review and approve item listings</p>
              </div>

              {/* Item Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-yellow-900">{pendingItems.length}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-green-900">{approvedItems.length}</div>
                  <div className="text-sm text-green-700">Approved</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-semibold text-red-900">{rejectedItems.length}</div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map(item => {
                      const seller = users.find(u => u.id === item.sellerId);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {seller ? seller.name : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'available' ? 'bg-green-100 text-green-700' :
                              item.status === 'sold' ? 'bg-gray-100 text-gray-600' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              item.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.approvalStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {item.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleItemApprovalChange(item.id, 'approved')}
                                  className="text-green-600 hover:text-green-900 inline-flex items-center"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleItemApprovalChange(item.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900 inline-flex items-center"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </button>
                              </>
                            )}
                            {item.approvalStatus === 'rejected' && (
                              <button
                                onClick={() => handleItemApprovalChange(item.id, 'approved')}
                                className="text-green-600 hover:text-green-900 inline-flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                            )}
                            {item.approvalStatus === 'approved' && (
                              <button
                                onClick={() => handleItemApprovalChange(item.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {items.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No items yet.
                  </div>
                )}
              </div>
            </>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}
