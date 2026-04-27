# PixelTruth Backend API

Express + MongoDB backend for the PixelTruth Video Integrity System.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your values:
   ```
   MONGO_URI=mongodb://localhost:27017/pixeltruth
   JWT_SECRET=your_secret_here
   ```

3. Make sure MongoDB is running locally (or use MongoDB Atlas URI).

4. Start the server:
   ```bash
   npm run dev      # development (nodemon)
   npm start        # production
   ```

Server runs on: http://localhost:5000

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET  | /api/auth/me | Get current user |

### Content (requires auth)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/upload | Upload & analyze file |
| GET  | /api/results/:id | Get result by ID |
| GET  | /api/history | Get user's upload history |
| GET  | /api/history/:id | Get single history item |

### Admin (requires admin role)
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/admin/stats | Dashboard statistics |
| GET    | /api/admin/uploads | All uploads |
| GET    | /api/admin/logs | System logs |
| GET    | /api/users | All users |
| DELETE | /api/users/:id | Delete user |
| PATCH  | /api/users/:id/role | Update user role |
| GET    | /api/violations | All violations |
