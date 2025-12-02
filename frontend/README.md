# 📦 Frontend Setup — React + TypeScript + Vite

This folder contains the frontend application built using **React**, **TypeScript**, and **Vite**.

------------------------------------------------------------

## 🚀 Prerequisites

Make sure you have the following installed:

- Node.js (v18 or higher recommended)
  Check version:
  node -v

- npm or yarn or pnpm

------------------------------------------------------------

## 📥 Installation

1) Navigate to the frontend folder
   cd frontend

2) Install dependencies

   Using npm:
   npm install

   Using yarn:
   yarn install

   Using pnpm:
   pnpm install

------------------------------------------------------------

## ▶️ Running the Development Server

Start the development server:
npm run dev

Vite will typically run on:
http://localhost:5173

------------------------------------------------------------

## 🏗️ Build for Production

npm run build

Creates optimized files in the dist/ folder.

------------------------------------------------------------

## 🧪 Preview Production Build

npm run preview

Serves the production build locally.

------------------------------------------------------------

## 📂 Project Structure

frontend/
  public/                -> Static public assets
  src/
    assets/             -> Images, icons, fonts
    components/         -> Reusable React components
    pages/              -> Page-level views
    hooks/              -> Custom React hooks
    types/              -> TypeScript definitions
    App.tsx             -> Main app component
    main.tsx            -> App entry point
    vite-env.d.ts       -> Vite TypeScript env types
  index.html
  package.json
  tsconfig.json
  vite.config.ts

------------------------------------------------------------

## 🧰 Available Scripts

npm run dev       -> Start development server
npm run build     -> Create production build
npm run preview   -> Serve production build locally
npm run lint      -> Optional: Run ESLint checks

------------------------------------------------------------

## 🔐 Environment Variables

Create a file named ".env" in the frontend folder:

VITE_API_URL=http://localhost:8000

IMPORTANT:
- All env variables MUST start with VITE_
- Do NOT commit .env to version control

Use inside TypeScript/React code:
const apiUrl = import.meta.env.VITE_API_URL;

(Type suggested)
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

------------------------------------------------------------

## ✔️ TypeScript Guidelines

- Use .tsx for React components
- Use .ts for utilities, types, services
- Recommended: store shared types in src/types/

Example:
export interface User {
  id: number;
  name: string;
}

------------------------------------------------------------

## ♻️ Reset / Clean Install

rm -rf node_modules
npm install

------------------------------------------------------------

## ☁️ Deployment

Build production files:
npm run build

Deploy contents of dist/ to:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront
- Docker / Nginx

------------------------------------------------------------

## 🙌 Contributing

1) Create a new branch:
   git checkout -b feature/my-feature

2) Commit changes:
   git commit -m "Add my feature"

3) Push to remote:
   git push origin feature/my-feature

------------------------------------------------------------

## ❓ Troubleshooting

- If port is busy, change it in vite.config.ts
- If TypeScript can't find types, run:
  npm i -D @types/<package>

- If auto-imports fail, restart TypeScript server in your editor.

------------------------------------------------------------
