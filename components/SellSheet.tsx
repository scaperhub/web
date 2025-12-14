import { useState, useEffect } from 'react';
import { Category, User } from '@/lib/types';
import { X, Minus, Plus } from 'lucide-react';
import { countries } from '@/lib/locations';

interface SellSheetProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (itemId: string) => void;
}

export default function SellSheet({ user, isOpen, onClose, onSuccess }: SellSheetProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '1',
    categoryId: '',
    subcategoryId: '',
    location: '',
    condition: 'used' as 'new' | 'used' | 'refurbished',
    images: [] as string[],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data.categories || []));
      
      // Prefill location from user profile
      const getCountryName = (code: string) => {
        const country = countries.find(c => c.code === code);
        return country ? country.name : code;
      };
      
      let locationText = '';
      if (user.city && user.country) {
        locationText = `${user.city}, ${getCountryName(user.country)}`;
      } else if (user.country) {
        locationText = getCountryName(user.country);
      } else if (user.city) {
        locationText = user.city;
      }
      
      if (locationText) {
        setFormData(prev => ({ ...prev, location: locationText }));
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all required fields
    if (!formData.title || !formData.description || !formData.price || !formData.categoryId || !formData.location || !formData.condition || formData.images.length === 0) {
      setError('Please fill in all required fields including at least one image.');
      return;
    }
    
    // Validate subcategory only if the selected category has subcategories
    if (selectedCategory && selectedCategory.subcategories.length > 0 && !formData.subcategoryId) {
      setError('Please select a subcategory.');
      return;
    }

    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          subcategoryId: formData.subcategoryId || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create item');
        setLoading(false);
        return;
      }

      // Reset form but keep location from user profile
      const getCountryName = (code: string) => {
        const country = countries.find(c => c.code === code);
        return country ? country.name : code;
      };
      
      let locationText = '';
      if (user?.city && user?.country) {
        locationText = `${user.city}, ${getCountryName(user.country)}`;
      } else if (user?.country) {
        locationText = getCountryName(user.country);
      } else if (user?.city) {
        locationText = user.city;
      }
      
      setFormData({
        title: '',
        description: '',
        price: '',
        quantity: '1',
        categoryId: '',
        subcategoryId: '',
        location: locationText,
        condition: 'used',
        images: [],
      });
      setImageUrl('');
      setError('');
      
      onClose();
      if (onSuccess) {
        onSuccess(data.item.id);
      } else {
        window.location.href = `/items/${data.item.id}`;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const addImage = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const token = localStorage.getItem('token');
    
    setUploadingImages(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (!formData.images.includes(data.url)) {
        setFormData({ ...formData, images: [...formData.images, data.url] });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleMultipleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    setUploadingImages(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload image');
        }

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newUrls = uploadedUrls.filter(url => !formData.images.includes(url));
      
      if (newUrls.length > 0) {
        setFormData({ ...formData, images: [...formData.images, ...newUrls] });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-1/2 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-all duration-300 ease-out ${
          isOpen 
            ? 'translate-y-0 translate-x-[-50%] opacity-100' 
            : 'translate-y-full translate-x-[-50%] opacity-0 pointer-events-none'
        }`}
        style={{ 
          maxHeight: '90vh',
          width: '100%',
          maxWidth: '640px'
        }}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">List an Item</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new listing for your aquarium equipment</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const currentQty = parseInt(formData.quantity) || 1;
                      if (currentQty > 1) {
                        setFormData({ ...formData, quantity: String(currentQty - 1) });
                      }
                    }}
                    disabled={parseInt(formData.quantity) <= 1}
                    className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-gray-200 flex items-center justify-center min-w-[44px]"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 1)) {
                        setFormData({ ...formData, quantity: value });
                      }
                    }}
                    onBlur={e => {
                      if (!e.target.value || parseInt(e.target.value) < 1) {
                        setFormData({ ...formData, quantity: '1' });
                      }
                    }}
                    required
                    className="w-20 px-4 py-2.5 text-center border-0 focus:outline-none focus:ring-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentQty = parseInt(formData.quantity) || 1;
                      setFormData({ ...formData, quantity: String(currentQty + 1) });
                    }}
                    className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border-l border-gray-200 flex items-center justify-center min-w-[44px]"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                  required
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory {selectedCategory && selectedCategory.subcategories.length > 0 ? '*' : ''}
                </label>
                <select
                  value={formData.subcategoryId}
                  onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })}
                  required={selectedCategory && selectedCategory.subcategories.length > 0}
                  disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedCategory 
                      ? 'Select a category first' 
                      : selectedCategory.subcategories.length === 0 
                        ? 'No subcategories available' 
                        : 'Select a subcategory'}
                  </option>
                  {selectedCategory?.subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value as any })}
                  required
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleMultipleImageUpload(files);
                    }
                  }}
                  disabled={uploadingImages}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all disabled:opacity-50 mb-3"
                />
                {uploadingImages && (
                  <p className="text-sm text-gray-500 mb-3">Uploading images...</p>
                )}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'List Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

