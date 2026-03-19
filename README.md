# Items REST API

A production-ready REST API built with **Express.js**, **MongoDB** (Mongoose), **JWT authentication**, **Zod validation**, and **Swagger documentation**.

The API now starts in a degraded mode when MongoDB Atlas is temporarily unavailable: `/health` and `/api-docs` stay online, while database-backed endpoints return `503 Service Unavailable` until the connection succeeds.

## Features

- 🔐 **JWT Authentication** — Access + refresh tokens with secure password hashing (bcrypt)
- 📦 **Full CRUD** — Create, read, update, delete items with pagination, filtering, and sorting
- 📝 **Zod Validation** — Request body validation with detailed error messages
- 📚 **Swagger/OpenAPI Docs** — Interactive API documentation at `/api-docs`
- 🔒 **Security** — Helmet.js, rate limiting, CORS, input sanitization
- 🛠 **Production-Ready** — Error handling, logging, environment config
- 📊 **Item Statistics** — Aggregate stats endpoint for inventory insights

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Rest-API

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Atlas URI and secrets
```

### Configuration

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/restapi?retryWrites=true&w=majority
JWT_SECRET=your_very_long_random_secret_key_here
JWT_REFRESH_SECRET=another_long_random_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

If you are using MongoDB Atlas, add your current machine's IP address to **Network Access**. If Atlas is unreachable, the server will stay up and retry the database connection every 30 seconds.

### Run

```bash
# Development
npm run dev

# Production
npm start

# Smoke tests
npm test
```

Server runs on `http://localhost:3000`

## API Documentation

Once running, visit: **http://localhost:3000/api-docs**

Interactive Swagger UI lets you test all endpoints directly in the browser.

## Degraded Startup Behavior

- `GET /health`, `GET /api-docs`, and `GET /api-docs/swagger.json` stay available even if MongoDB is down.
- `POST /api/auth/*` and `GET/POST/PUT/DELETE /api/items*` return `503` with:

```json
{
  "success": false,
  "message": "Database unavailable. Please try again later."
}
```

- The server retries the Atlas connection every 30 seconds in the background until it succeeds.

## API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and get tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get current user profile |

### Item Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | List items (paginated) |
| `GET` | `/api/items/stats` | Get item statistics |
| `GET` | `/api/items/:id` | Get single item |
| `POST` | `/api/items` | Create item |
| `PUT` | `/api/items/:id` | Update item |
| `DELETE` | `/api/items/:id` | Delete item |

### Query Parameters (GET /api/items)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 10 | Items per page (max 100) |
| `search` | string | "" | Search in name/description |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | Sort direction |
| `category` | string | - | Filter by category |
| `minPrice` | number | - | Minimum price |
| `maxPrice` | number | - | Maximum price |
| `inStock` | boolean | - | Filter by stock status (`true` or `false`) |

## Example Usage

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'
```

### Create Item (Authenticated)

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Wireless Mouse","price":0,"category":"Electronics","inStock":true}'
```

### List Items with Filters

```bash
curl "http://localhost:3000/api/items?page=1&limit=10&search=mouse&category=Electronics&minPrice=10&maxPrice=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "fieldName", "message": "Details" }]
}
```

### Health Check Response

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-03-19T00:00:00.000Z",
  "uptime": 12.34,
  "database": {
    "connected": false,
    "state": "disconnected",
    "lastError": "Could not connect to any servers in your MongoDB Atlas cluster."
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MONGO_URI` | - | MongoDB Atlas connection string |
| `JWT_SECRET` | - | Access token secret |
| `JWT_REFRESH_SECRET` | - | Refresh token secret |
| `JWT_EXPIRES_IN` | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token expiry |

## Project Structure

```
src/
├── config/
│   ├── db.js           # MongoDB connection
│   └── swagger.js      # Swagger/OpenAPI config
├── controllers/
│   ├── auth.controller.js
│   └── item.controller.js
├── middlewares/
│   ├── auth.middleware.js      # JWT verification
│   ├── error.middleware.js      # Global error handler
│   ├── notFound.middleware.js   # 404 handler
│   └── validate.middleware.js   # Zod validation
├── models/
│   ├── item.model.js
│   └── user.model.js
├── routes/
│   ├── auth.routes.js
│   └── item.routes.js
├── schemas/
│   ├── auth.schema.js
│   └── item.schema.js
├── utils/
│   └── jwt.utils.js
└── app.js
```

## License

MIT © Sayan Senapati
