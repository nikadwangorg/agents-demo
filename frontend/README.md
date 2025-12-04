# OKR Management Frontend

Modern, responsive web interface for the OKR Management System.

## Features

- ✅ Create and manage Objectives
- ✅ Add Key Results to Objectives
- ✅ Track progress with visual indicators
- ✅ Update Key Result values in real-time
- ✅ Delete Objectives and Key Results
- ✅ Responsive design with Chakra UI

## Tech Stack

- React 18
- TypeScript
- Vite
- Chakra UI
- TanStack Query (React Query)
- Axios

## Development

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will run on http://localhost:5173 and proxy API requests to http://localhost:3000.

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_BASE_URL=/api
```

For production, you can set this to your backend URL.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ObjectiveCard.tsx
│   │   ├── CreateObjectiveModal.tsx
│   │   ├── CreateKeyResultModal.tsx
│   │   └── UpdateProgressModal.tsx
│   ├── api.ts              # API client
│   ├── hooks.ts            # React Query hooks
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── index.html
├── vite.config.ts
└── package.json
```
