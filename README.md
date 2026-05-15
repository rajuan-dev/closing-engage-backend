# closing-engage-backend

Production-ready backend foundation for the Closing Engage app and website.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Pino logger
- Zod environment validation

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Make sure MongoDB is running locally or update `MONGODB_URI` to your target database.

## Environment Variables

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
MONGODB_URI=mongodb://localhost:27017/closing-engage
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

## Available Scripts

- `npm run dev` - Run the development server with auto-reload
- `npm run build` - Compile TypeScript into `dist`
- `npm run start` - Start the compiled server
- `npm run typecheck` - Run TypeScript checks without emitting files
- `npm run lint` - Run ESLint
- `npm run format` - Format the project with Prettier

## Health Check

- `GET http://localhost:5000/api/v1/health`

Example response:

```json
{
  "success": true,
  "message": "Closing Engage Backend is running",
  "data": {
    "service": "closing-engage-backend",
    "status": "healthy",
    "timestamp": "2026-05-16T00:00:00.000Z"
  }
}
```
