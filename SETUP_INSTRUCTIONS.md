# DreamXI User Management & Persistence System Setup

## Overview
This system implements user management and data persistence using PostgreSQL. All user data, including shortlisted players, is stored in the database and persists across sessions.

## Features Implemented

1. **User Registration & Authentication**
   - Users are stored in PostgreSQL via Django's User model
   - Email/username-based login with improved authentication logic
   - User data persists in the database

2. **Admin Account**
   - Pre-configured admin account: `admin@dreamxi.com` / `admin123`
   - Only admin can access the admin panel
   - Regular users are automatically redirected away from admin routes

3. **User Shortlist Persistence**
   - Shortlisted players are stored in PostgreSQL (`UserShortlist` model)
   - Data persists across sessions and devices
   - Each user has isolated shortlist data
   - No data leakage between users

## Setup Instructions

### 1. Run Database Migrations

```bash
cd backend
python manage.py migrate
```

This will create the `UserShortlist` table in PostgreSQL.

### 2. Create Admin Account

```bash
cd backend
python manage.py create_admin
```

This command will:
- Create the admin account if it doesn't exist
- Update the admin account if it already exists
- Set username: `admin@dreamxi.com`
- Set password: `admin123`
- Enable staff and superuser privileges

### 3. Start the Servers

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
npm run dev
```

## API Endpoints

### Shortlist Endpoints (All require authentication)

- `GET /api/shortlist/` - Get all shortlisted player IDs for current user
- `POST /api/shortlist/add/` - Add a player to shortlist
  - Body: `{ "player_id": 123 }`
- `POST /api/shortlist/remove/` - Remove a player from shortlist
  - Body: `{ "player_id": 123 }`
- `POST /api/shortlist/toggle/` - Toggle a player in/out of shortlist
  - Body: `{ "player_id": 123 }`
  - Returns: `{ "in_shortlist": true/false }`
- `DELETE /api/shortlist/clear/` - Clear all players from shortlist

## Database Schema

### UserShortlist Model
```python
- user: ForeignKey to User
- player: ForeignKey to Player
- created_at: DateTime (auto)
- Unique constraint on (user, player)
```

## User Data Isolation

- Each user's shortlist is completely isolated
- Data is stored per-user in PostgreSQL
- No localStorage usage for shortlist (all data in database)
- Users cannot see other users' shortlisted players

## Testing

1. **Create a new user account** via the signup page
2. **Login** with the new account
3. **Add players to shortlist** from any page (Top Players, Set-piece Specialists, etc.)
4. **Logout and login again** - shortlisted players should still be there
5. **Login with a different user** - should see an empty shortlist
6. **Login as admin** (`admin@dreamxi.com` / `admin123`) - should only see admin panel

## Notes

- Old localStorage shortlist data is automatically cleaned up on login
- All shortlist operations are now async and use the API
- Frontend components have been updated to use the new API-based system
- The system ensures complete data isolation between users

