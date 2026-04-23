# SASF Law Firm

SASF Law Firm now uses a Vite + React frontend and a separate Express backend.

## Stack

- `client/`: Vite, React, Tailwind CSS
- `server/`: Node.js, Express, Neon database connector

## Role Themes

- Lawyer: green
- Assistant: yellow
- Client: red

## Run

Start the server:

```bash
cd server
npm install
npm run dev
```

Start the client:

```bash
cd client
npm install
npm run dev
```

The client proxies `/api` and `/uploads` to the server during development.
