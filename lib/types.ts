export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserType = 'hobbyist' | 'shop';
export type ItemApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  status: UserStatus;
  userType: UserType; // hobbyist or shop
  emailVerified: boolean;
  verified: boolean; // Admin-verified badge
  following: string[]; // Array of user IDs that this user follows
  createdAt: string;
  bio?: string;
  avatar?: string;
  backgroundPicture?: string;
  country?: string;
  city?: string;
}

export interface OTP {
  id: string;
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  categoryId: string;
  subcategoryId: string;
  sellerId: string;
  status: 'available' | 'sold' | 'pending';
  approvalStatus: ItemApprovalStatus;
  createdAt: string;
  updatedAt: string;
  location?: string;
  condition?: 'new' | 'used' | 'refurbished';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  itemId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

