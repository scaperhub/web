import { supabase, supabaseAdmin } from './supabase';
import { User, Category, Item, Message, Conversation, OTP } from './types';


// Check if Supabase is properly configured
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isSupabaseConfigured) {
  throw new Error('Supabase is not configured. This module should only be used when USE_SUPABASE is true.');
}

// Helper to ensure supabase is not null
function getSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized');
  return supabase;
}

// Helper to ensure supabaseAdmin is not null
function getSupabaseAdmin() {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  return supabaseAdmin;
}
// Helper functions to convert database types
function toUser(data: any): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    status: data.status,
    userType: data.userType,
    emailVerified: data.emailVerified,
    verified: data.verified,
    following: data.following || [],
    createdAt: data.createdAt,
    bio: data.bio,
    avatar: data.avatar,
    backgroundPicture: data.backgroundPicture,
    country: data.country,
    city: data.city,
  };
}

function toItem(data: any): Item {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    price: data.price,
    quantity: data.quantity,
    images: data.images || [],
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId || '',
    sellerId: data.sellerId,
    status: data.status,
    approvalStatus: data.approvalStatus,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    location: data.location,
    condition: data.condition,
  };
}

function toMessage(data: any): Message {
  return {
    id: data.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    receiverId: data.receiverId,
    itemId: data.itemId,
    content: data.content,
    createdAt: data.createdAt,
    read: data.read,
  };
}

function toConversation(data: any): Conversation {
  return {
    id: data.id,
    itemId: data.itemId,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastMessage: data.lastMessage,
    lastMessageAt: data.lastMessageAt,
  };
}

function toOTP(data: any): OTP {
  return {
    id: data.id,
    email: data.email,
    code: data.code,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
  };
}
export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toUser);
    },
    
    getByEmail: async (email: string): Promise<User | undefined> => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) return undefined;
      return toUser(data);
    },
    
    getById: async (id: string): Promise<User | undefined> => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return toUser(data);
    },
    
    getByUsername: async (username: string): Promise<User | undefined> => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !data) return undefined;
      return toUser(data);
    },
    
    create: async (user: User): Promise<User> => {
      const { data, error } = await getSupabase()
        .from('users')
        .insert({
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          status: user.status,
          userType: user.userType,
          emailVerified: user.emailVerified,
          verified: user.verified,
          following: user.following,
          createdAt: user.createdAt,
          bio: user.bio,
          avatar: user.avatar,
          backgroundPicture: user.backgroundPicture,
          country: user.country,
          city: user.city,
        })
        .select()
        .single();
      
      if (error) throw error;
      return toUser(data);
    },
    
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const { data, error } = await getSupabase()
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return toUser(data);
    },
    
    delete: async (id: string): Promise<boolean> => {
      const admin = getSupabaseAdmin();

      try {
        // Delete in order to respect foreign key constraints:
        // 1. First, get all conversations where user is involved
        const { data: userConversations, error: convFetchError } = await admin
          .from('conversations')
          .select('id')
          .or(`buyerId.eq.${id},sellerId.eq.${id}`);

        if (convFetchError) {
          console.error('Error fetching conversations:', convFetchError);
          throw new Error(`Failed to fetch conversations: ${convFetchError.message}`);
        }

        // 2. Delete all messages in those conversations (if any conversations exist)
        if (userConversations && userConversations.length > 0) {
          const conversationIds = userConversations.map(c => c.id);
          const { error: messagesError } = await admin
            .from('messages')
            .delete()
            .in('conversationId', conversationIds);

          if (messagesError) {
            console.error('Error deleting messages in conversations:', messagesError);
            throw new Error(`Failed to delete messages: ${messagesError.message}`);
          }
        }

        // 3. Delete any remaining messages where user is sender or receiver (orphaned messages)
        const { error: orphanedMessagesError } = await admin
          .from('messages')
          .delete()
          .or(`senderId.eq.${id},receiverId.eq.${id}`);

        if (orphanedMessagesError) {
          console.error('Error deleting orphaned messages:', orphanedMessagesError);
          throw new Error(`Failed to delete orphaned messages: ${orphanedMessagesError.message}`);
        }

        // 4. Delete conversations where user is buyer or seller
        const { error: conversationsError } = await admin
          .from('conversations')
          .delete()
          .or(`buyerId.eq.${id},sellerId.eq.${id}`);

        if (conversationsError) {
          console.error('Error deleting conversations:', conversationsError);
          throw new Error(`Failed to delete conversations: ${conversationsError.message}`);
        }

        // 5. Delete items where user is seller
        const { error: itemsError } = await admin
          .from('items')
          .delete()
          .eq('sellerId', id);

        if (itemsError) {
          console.error('Error deleting items:', itemsError);
          throw new Error(`Failed to delete items: ${itemsError.message}`);
        }

        // 6. Finally, delete the user
        const { error: userError } = await admin
          .from('users')
          .delete()
          .eq('id', id);

        if (userError) {
          console.error('Error deleting user:', userError);
          throw new Error(`Failed to delete user: ${userError.message}`);
        }

        return true;
      } catch (error: any) {
        console.error('Error deleting user:', error);
        throw error; // Re-throw to let the API handler handle it
      }
    },
  
  categories: {
    getAll: async (): Promise<Category[]> => {
      const { data: categories, error } = await getSupabase()
        .from('categories')
        .select('*, subcategories(*)')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      return (categories || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        createdAt: cat.createdAt,
        subcategories: (cat.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt,
        })),
      }));
    },
    
    getById: async (id: string): Promise<Category | undefined> => {
      const { data, error } = await getSupabase()
        .from('categories')
        .select('*, subcategories(*)')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: data.createdAt,
        subcategories: (data.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt,
        })),
      };
    },
    
    create: async (category: Category): Promise<Category> => {
      // First create category
      const { data: insertData, error: catError } = await getSupabase()
        .from('categories')
        .insert({
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
        })
        .select()
        .single();
      
      if (catError) throw catError;
      
      // Then create subcategories
      if (category.subcategories.length > 0) {
        const { error: subError } = await getSupabase()
          .from('subcategories')
          .insert(
            category.subcategories.map(sub => ({
              id: sub.id,
              name: sub.name,
              categoryId: category.id,
              description: sub.description,
              createdAt: sub.createdAt,
            }))
          );
        
        if (subError) throw subError;
      }
      
      // Fetch with subcategories
      const { data: fetchedCatData, error: fetchErr } = await getSupabase()
        .from('categories')
        .select('*, subcategories(*)')
        .eq('id', category.id)
        .single();
      
      if (fetchErr || !fetchedCatData) throw fetchErr || new Error('Category not found');
      
      return {
        id: fetchedCatData.id,
        name: fetchedCatData.name,
        description: fetchedCatData.description || undefined,
        createdAt: fetchedCatData.createdAt,
        subcategories: (fetchedCatData.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt,
        })),
      };
    },
    
    update: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
      // Update category
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await getSupabase()
          .from('categories')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;
      }
      
      // Update subcategories if provided
      if (updates.subcategories) {
        // Delete existing subcategories
        await getSupabase().from('subcategories').delete().eq('categoryId', id);
        
        // Insert new subcategories
        if (updates.subcategories.length > 0) {
          const { error } = await getSupabase()
            .from('subcategories')
            .insert(
              updates.subcategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                categoryId: id,
                description: sub.description,
                createdAt: sub.createdAt,
              }))
            );
          
          if (error) throw error;
        }
      }
      
      const { data: updateCatData, error: updateErr } = await getSupabase()
        .from('categories')
        .select('*, subcategories(*)')
        .eq('id', id)
        .single();
      
      if (updateErr || !updateCatData) return null;
      
      const category = {
        id: updateCatData.id,
        name: updateCatData.name,
        description: updateCatData.description || undefined,
        createdAt: updateCatData.createdAt,
        subcategories: (updateCatData.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt,
        })),
      };
      return category ?? null;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const { error } = await getSupabase()
        .from('categories')
        .delete()
        .eq('id', id);
      
      return !error;
    },
  },
  
  items: {
    getAll: async (): Promise<Item[]> => {
      const { data, error } = await getSupabase()
        .from('items')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toItem);
    },
    
    getById: async (id: string): Promise<Item | undefined> => {
      const { data, error } = await getSupabase()
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return toItem(data);
    },
    
    getBySeller: async (sellerId: string): Promise<Item[]> => {
      const { data, error } = await getSupabase()
        .from('items')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toItem);
    },
    
    getByCategory: async (categoryId: string): Promise<Item[]> => {
      const { data, error } = await getSupabase()
        .from('items')
        .select('*')
        .eq('categoryId', categoryId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toItem);
    },
    
    create: async (item: Item): Promise<Item> => {
      const { data, error } = await getSupabase()
        .from('items')
        .insert({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          images: item.images,
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId || null,
          sellerId: item.sellerId,
          status: item.status,
          approvalStatus: item.approvalStatus,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          location: item.location,
          condition: item.condition,
        })
        .select()
        .single();
      
      if (error) throw error;
      return toItem(data);
    },
    
    update: async (id: string, updates: Partial<Item>): Promise<Item | null> => {
      const { data, error } = await getSupabase()
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return toItem(data);
    },
    
    delete: async (id: string): Promise<boolean> => {
      const { error } = await getSupabase()
        .from('items')
        .delete()
        .eq('id', id);
      
      return !error;
    },
  },
  
  messages: {
    getAll: async (): Promise<Message[]> => {
      const { data, error } = await getSupabase()
        .from('messages')
        .select('*')
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(toMessage);
    },
    
    getByConversation: async (conversationId: string): Promise<Message[]> => {
      const { data, error } = await getSupabase()
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(toMessage);
    },
    
    create: async (message: Message): Promise<Message> => {
      const { data, error } = await getSupabase()
        .from('messages')
        .insert({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          itemId: message.itemId,
          content: message.content,
          createdAt: message.createdAt,
          read: message.read,
        })
        .select()
        .single();
      
      if (error) throw error;
      return toMessage(data);
    },
    
    markAsRead: async (conversationId: string, userId: string): Promise<void> => {
      const client = getSupabase();
      await client
        .from('messages')
        .update({ read: true })
        .eq('conversationId', conversationId)
        .eq('receiverId', userId)
        .eq('read', false);
    },
  },
  
  conversations: {
    getAll: async (): Promise<Conversation[]> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .select('*')
        .order('updatedAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toConversation);
    },
    
    getByUser: async (userId: string): Promise<Conversation[]> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .select('*')
        .or(`buyerId.eq.${userId},sellerId.eq.${userId}`)
        .order('updatedAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toConversation);
    },
    
    getById: async (id: string): Promise<Conversation | undefined> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return toConversation(data);
    },
    
    getByItemAndBuyer: async (itemId: string, buyerId: string): Promise<Conversation | undefined> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .select('*')
        .eq('itemId', itemId)
        .eq('buyerId', buyerId)
        .single();
      
      if (error || !data) return undefined;
      return toConversation(data);
    },
    
    create: async (conversation: Conversation): Promise<Conversation> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .insert({
          id: conversation.id,
          itemId: conversation.itemId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return toConversation(data);
    },
    
    update: async (id: string, updates: Partial<Conversation>): Promise<Conversation | null> => {
      const { data, error } = await getSupabase()
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return toConversation(data);
    },
  },
  
  otps: {
    getAll: async (): Promise<OTP[]> => {
      const { data, error } = await getSupabase()
        .from('otps')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toOTP);
    },
    
    getByEmail: async (email: string): Promise<OTP | undefined> => {
      const { data, error } = await getSupabase()
        .from('otps')
        .select('*')
        .eq('email', email)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) return undefined;
      return toOTP(data);
    },
    
    create: async (otp: OTP): Promise<OTP> => {
      // Delete old OTPs for this email
      await getSupabase().from('otps').delete().eq('email', otp.email);
      
      const { data, error } = await getSupabase()
        .from('otps')
        .insert({
          id: otp.id,
          email: otp.email,
          code: otp.code,
          expiresAt: otp.expiresAt,
          createdAt: otp.createdAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return toOTP(data);
    },
    
    delete: async (email: string): Promise<void> => {
      await getSupabase().from('otps').delete().eq('email', email);
    },
    
    cleanup: async (): Promise<void> => {
      const now = new Date().toISOString();
      await getSupabase().from('otps').delete().lt('expiresAt', now);
    },
  },
};





