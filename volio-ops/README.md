# VOLIO Operations

A premium Next.js + Firebase Realtime Database operations/finance dashboard.

## Stack

- Next.js 16.4
- React 19.3
- Firebase JS SDK 12.19
- Firebase Authentication (email/password)
- Firebase Realtime Database
- Vercel for hosting

Firebase's modular web SDK is used. Realtime Database stores JSON and synchronizes changes to connected clients in real time.

## 1. Install

```bash
npm install
```

## 2. Environment

Copy `.env.example` to `.env.local` and fill in your Firebase web app values.

The VOLIO Firebase config supplied for this project is already documented in the project setup conversation. Do not commit `.env.local`.

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## 4. Firebase

Email/password authentication must be enabled.

Realtime Database must be created. Start in locked mode.

The `firebase.rules.json` file is a starting ruleset for the prototype. Before adding staff accounts, tighten permissions around roles and user-owned records. Do not use public read/write rules.

## 5. Vercel

Push this project to GitHub, import the repository into Vercel, and add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel Project Settings.

## Important

This build intentionally keeps the app client-side with Firebase Authentication + Realtime Database. It does not use Firestore or Firebase Hosting.

The detailed modules for Cash Flow, Receivables, Payables, Marketing, Activity and Business Health are scaffolded and share the same live data layer; Expenses, Orders, Inventory, Customers, Suppliers and Tasks already have working create/read flows.
