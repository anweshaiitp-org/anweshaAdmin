# Anwesha Admin Portal

Admin dashboard for **Anwesha 2027**, built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **NextAuth.js**.

The frontend communicates only with its own API routes. Those routes securely forward requests to the backend, keeping backend endpoints hidden from the browser.

---

# Prerequisites

Install:

* Node.js 20+
* npm

---

# Clone the Repository

```bash
git clone https://github.com/anweshaiitp-org/anwesha-admin.git

cd anwesha-admin
```

---

# Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a file named

```text
.env
```

Add the following variables:

```env
# Backend API Gateway URL
BACKEND_URL=https://87r5epgee5.execute-api.localhost.localstack.cloud:4566/prod

# NextAuth Secret
NEXTAUTH_SECRET=your-super-secret-key

# Frontend URL
NEXTAUTH_URL=http://localhost:3000
```

> **BACKEND_URL** should point to your deployed backend API Gateway.

---

# Start the Development Server

```bash
npm run dev
```

The application will be available at

```
http://localhost:3000
```

---

# Authentication

Authentication is handled using **NextAuth Credentials Provider**.

Login requests follow this flow:

```
Browser
      │
      ▼
Next.js API Route (/api/admin/login)
      │
      ▼
Anwesha Backend API
      │
      ▼
JWT Token
      │
      ▼
NextAuth Session
```

The backend URL is never exposed to the browser.

---

# Project Structure

```
app/
├── admin/
├── api/
│   ├── admin/
│   └── auth/
├── login/

components/

context/

types/

auth.ts

middleware.ts
```

---

# Available Scripts

Run development server

```bash
npm run dev
```

Create production build

```bash
npm run build
```

Start production server

```bash
npm start
```

Run linter

```bash
npm run lint
```

---

# Login

Use an administrator account created in the backend.

Example:

```
Email:
admin@anwesha.com

Password:
password
```

---

# Tech Stack

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* NextAuth.js
* Axios / Fetch API
* React Hot Toast
* React Icons
