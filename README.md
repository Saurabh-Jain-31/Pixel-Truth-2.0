# Pixel Truth 2.0

AI-Based Digital Content Fingerprinting and Unauthorized Media Detection System.

## Project Structure

```
├── pixeltruth/          # React frontend (Vite + Tailwind CSS)
└── pixeltruth-backend/  # Node.js + Express + MongoDB backend
```

## Frontend Setup

```bash
cd pixeltruth
npm install
npm run dev
```

Runs on: http://localhost:3000

## Backend Setup

```bash
cd pixeltruth-backend
npm install
# Copy .env.example to .env and set your MONGO_URI
npm run dev
```

Runs on: http://localhost:5000

## Environment Variables

### Backend (`pixeltruth-backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pixeltruth
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### Frontend (`pixeltruth/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Multer
- **Auth:** Role-based (Admin / Consumer)
