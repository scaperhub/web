# ScaperHub. - Aquarium Marketplace

A full-featured marketplace for aquarium hobbyists to buy and sell aquarium equipment and supplies.

## Features

- **User Authentication**: Sign up, login, and user profiles
- **Item Listings**: Sellers can post items with images, descriptions, and pricing
- **Category Management**: Admin can create categories and subcategories
- **Search & Filter**: Integrated search and category filtering on the homepage
- **Messaging System**: Buyers and sellers can chat about items
- **User Profiles**: Each user has a profile page showing their listed items
- **Admin Dashboard**: Admin controls categories and has full system access

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: JSON file-based storage (easily replaceable with a real database)
- **Authentication**: JWT tokens with bcrypt password hashing

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (optional, for production):
```
JWT_SECRET=your-secret-key-here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Admin User

To create the first admin user, you can either:
1. Manually edit the `data/users.json` file after creating a user account
2. Or modify the registration API to allow the first user to be admin

## Project Structure

```
├── components/          # React components
├── lib/                # Utility functions and database
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   └── *.tsx          # Page components
├── styles/            # Global styles
└── data/              # JSON database files (created at runtime)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - List items (with optional filters)
- `POST /api/items` - Create new item
- `GET /api/items/[id]` - Get item details
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin only)
- `GET /api/categories/[id]` - Get category details
- `PUT /api/categories/[id]` - Update category (admin only)
- `DELETE /api/categories/[id]` - Delete category (admin only)

### Messages
- `GET /api/messages` - Get conversations or messages
- `POST /api/messages` - Send a message

## Pages

- `/` - Home page with integrated search, banner, and featured items
- `/sell` - List a new item (requires login)
- `/items/[id]` - Item detail page
- `/profile/[id]` - User profile page
- `/messages` - Messaging interface
- `/admin` - Admin dashboard (admin only)
- `/login` - Login page
- `/register` - Registration page

## Database

The application uses a simple JSON file-based database stored in the `data/` directory. In production, you should replace this with a proper database like PostgreSQL, MongoDB, or MySQL.

## Future Enhancements

- Real-time messaging with WebSockets
- Image upload functionality
- Payment integration
- Reviews and ratings
- Advanced search and filters
- Email notifications
- Item favorites/wishlist

## License

MIT

