# SkillPay — Escrow-Based Freelance Marketplace for Students

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)](https://www.mongodb.com)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-blue?logo=razorpay)](https://razorpay.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **SkillPay** connects university students (freelancers) with clients through a secure escrow payment system. Funds are locked until the client approves delivery — protecting both parties.

---

## 🚀 Live Demo

| Role   | URL | Credentials |
|--------|-----|-------------|
| Admin  | http://localhost:5173/admin-dashboard | `admin@skillpay.dev` / `Admin1234` |
| Client | http://localhost:5173/dashboard | `client@test.com` / `Test1234` |
| Student | http://localhost:5173/student-dashboard | `student@test.com` / `Test1234` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  Vite + TanStack Query + Zustand + Framer Motion │
└──────────────────────┬──────────────────────────┘
                       │ REST + Socket.IO
┌──────────────────────▼──────────────────────────┐
│               Express.js Backend                 │
│  Helmet · Rate-Limit · JWT · express-validator   │
├──────────────┬───────────────────────────────────┤
│  MongoDB     │  Cloudinary   │  Razorpay         │
│  (Mongoose)  │  (Images)     │  (Payments)       │
└──────────────┴───────────────┴───────────────────┘
        │ Bull Queue (Redis) — Deadline jobs
```

---

## 💳 Payment Flows

### 1 — Hire & Escrow
```
Client hits "Pay & Hire"
  → Backend creates Razorpay order
  → Client completes payment in Razorpay modal
  → Razorpay Webhook confirms payment
  → Order status → in_progress, funds locked in escrow
```

### 2 — Release to Student
```
Client approves delivery on OrderDetail page
  → Backend: order.status → completed
  → student.walletBalance += order.amount
  → Platform fee deducted (configurable %)
```

### 3 — Dispute Resolution
```
Client raises dispute on in_progress order
  → Admin reviews on /admin/disputes
  → Admin picks: "Release to Student" or "Refund to Client"
  → If refund: razorpay.payments.refund() called automatically
```

---

## ✨ Features by Role

### 🎓 Student (Freelancer)
- Create & manage gigs with Cloudinary image uploads
- Accept / deliver orders with milestone tracking
- Wallet dashboard — balance, UPI withdraw, earnings chart
- Real-time notifications via Socket.IO

### 👔 Client
- Browse & search gigs by category / price
- Secure checkout with Razorpay
- Order detail — requirements, milestones, review form
- Raise disputes for in-progress orders

### 🛡️ Admin
- Platform metrics dashboard (revenue, orders, users, disputes)
- User management — search, filter by role, ban/unban toggle
- Dispute resolution modal — release to student or refund to client

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TanStack Query, Zustand, Framer Motion, Recharts |
| Styling | Tailwind CSS v4 |
| Backend | Node.js 22, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Payments | Razorpay (orders, webhooks, refunds) |
| File Upload | Multer + Cloudinary |
| Real-time | Socket.IO |
| Email | Nodemailer (Gmail SMTP) |
| Jobs | Bull (Redis) |
| Security | Helmet, express-rate-limit, express-validator |

---

## ⚡ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay test account
- Cloudinary account
- Redis (optional — only needed for deadline job queue)

### 1. Clone
```bash
git clone https://github.com/Shreya-1302/SkillPay.git
cd SkillPay
```

### 2. Server Setup
```bash
cd server
cp .env.example .env
# Fill in your values (see table below)
npm install
npm run dev
```

### 3. Client Setup
```bash
cd client
cp .env.example .env
# Set VITE_RAZORPAY_KEY_ID
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `PORT` | Express port | Any free port, default `5000` |
| `MONGO_URI` | MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) → Connect |
| `JWT_SECRET` | Access token secret (32+ chars) | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `openssl rand -hex 32` |
| `EMAIL_USER` | Gmail address for transactional emails | Google Account |
| `EMAIL_PASS` | Gmail App Password | Google → Security → App Passwords |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | Same as above |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret | Razorpay → Webhooks → Create |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [Cloudinary Console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Same as above |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Same as above |
| `REDIS_URL` | Redis connection URL | `redis://127.0.0.1:6379` (local) |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable key (same as server KEY_ID) |
| `VITE_API_URL` | Backend URL in production (default proxied via Vite) |

---

## 🧪 Test Credentials

> Create these accounts manually after running the server the first time.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@skillpay.dev` | `Admin1234` |
| Student | `student@test.com` | `Test1234` |
| Client | `client@test.com` | `Test1234` |

Use Razorpay **test card**: `4111 1111 1111 1111` (any future expiry, any CVV).

---

## 📁 Project Structure

```
SkillPay/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # Axios API clients
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components (client/ student/ admin/)
│   │   ├── store/          # Zustand state stores
│   │   └── utils/          # Helpers (format, date, etc.)
│   └── vite.config.js
└── server/                 # Express backend
    ├── controllers/        # Route handlers
    ├── jobs/               # Bull queue jobs
    ├── middleware/         # Auth, validation, error, upload
    ├── models/             # Mongoose schemas
    ├── routes/             # Express routers
    └── server.js
```

---

## 📄 License

MIT © 2025 SkillPay Team