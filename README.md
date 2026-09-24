# Jahan Ramesh - Professional Next.js Portfolio & Firebase CMS

A modern, production-ready developer portfolio built with **Next.js 14 (App Router)**, **React**, **Tailwind CSS**, and **Firebase** (Authentication, Firestore, and Storage).

The public portfolio is fully open to visitors with no login required, while projects are dynamically fetched from Firestore and managed through a private, secured **Admin CMS Dashboard** (`/admin/login`).

---

## 🌟 Features

### 🌐 Public Portfolio
- **Hero Section**: Dynamic typewriter text animation, floating avatar with glow effects, social media links (Facebook, GitHub, Instagram, YouTube, Twitter/X, LinkedIn, Discord, Stack Overflow, HackerRank), and "Download CV" button.
- **About Me**: Professional introduction with categorized technical skill stacks (Frontend, Backend, Database).
- **Services**: Web Development, Mobile App Development, and UI/UX Designing with interactive cards.
- **Dynamic Projects Section**:
  - Automatically queries published projects from Firestore sorted by display order.
  - Distinct **Featured Projects** and **All Projects** sections.
  - Interactive category filtering (All, Web App, Mobile App, Mobile Game, etc.).
  - Responsive cards with image preview, technology tags, and conditional GitHub and Live Demo buttons.
- **Skills**:
  - Technical Skills with percentage progress bars.
  - Professional Skills with SVG circular score indicators.
- **Contact Form**: EmailJS integration with validation and toast notifications.
- **Dark / Light Theme Toggle**: Persistent theme stored in `localStorage` without hydration errors.
- **SEO & Accessibility**: Complete Next.js metadata, OpenGraph, Twitter cards, `robots.txt`, and `sitemap.xml`.

### 🛡️ Private Admin CMS (`/admin/dashboard`)
- **Route Protection**: Direct access to `/admin/dashboard` is blocked and redirects to `/admin/login`.
- **Firebase Authentication**: Email and password authentication (no public signup page).
- **Project CMS Operations**:
  - **Create Project**: Title, category, descriptions, tech tags, GitHub/Live URLs, display order, featured & published toggles.
  - **Image Upload to Firebase Storage**: Real-time progress bar, file type & size validation (up to 10MB), and accessible image alt text.
  - **Edit Project**: Pre-populates all existing project fields for instant editing.
  - **Delete Project**: Confirmation modal with Firestore document deletion and automatic Storage cleanup.
  - **Instant Status Toggle**: Switch projects between *Published* and *Draft* with one click.
  - **Real-time Sync**: Firestore real-time listener updates the admin view immediately.
  - **1-Click Seed Button**: Seed the 6 original portfolio projects into Firestore at any time.

---

## 📁 Project Structure

```
├── public/
│   ├── assets/
│   │   ├── images/         # Static images (me.jpg, card1.gif, etc.)
│   │   └── cv/             # CV PDF documents
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.jsx      # Admin login page
│   │   │   └── dashboard/
│   │   │       └── page.jsx      # Admin CMS dashboard
│   │   ├── globals.css           # Tailwind & custom CSS variables
│   │   ├── layout.jsx            # Root layout, metadata & providers
│   │   ├── page.jsx              # Main public portfolio page
│   │   ├── robots.js             # robots.txt generator
│   │   └── sitemap.js            # sitemap.xml generator
│   ├── components/
│   │   ├── Navbar.jsx            # Responsive navigation & CV button
│   │   ├── Hero.jsx              # Typewriter hero with avatar & links
│   │   ├── About.jsx             # Bio & categorized skill stacks
│   │   ├── Services.jsx          # Services grid
│   │   ├── Projects.jsx          # Dynamic Firestore projects section
│   │   ├── ProjectCard.jsx       # Individual project card
│   │   ├── Skills.jsx            # Technical bars & circular indicators
│   │   ├── Contact.jsx           # EmailJS contact form
│   │   ├── Footer.jsx            # Footer & social links
│   │   ├── ThemeToggle.jsx       # Dark/Light mode toggle & context
│   │   ├── Toast.jsx             # Toast notification system
│   │   └── admin/
│   │       ├── Sidebar.jsx           # Responsive admin sidebar & drawer
│   │       ├── DashboardStats.jsx    # Stats cards (Total, Published, etc.)
│   │       ├── ProjectTable.jsx      # Projects directory & live search
│   │       ├── ProjectFormModal.jsx  # Add/Edit modal with image upload
│   │       └── DeleteConfirmModal.jsx# Delete confirmation modal
│   └── lib/
│       ├── firebase.js           # Firebase Web SDK initialization
│       ├── auth.js               # Firebase Auth helpers
│       ├── firestore.js          # Firestore CRUD & realtime listener
│       ├── storage.js            # Firebase Storage image uploader
│       └── initialProjects.js    # Pre-configured 6 original projects
├── .env                          # Environment variables
├── .env.example                  # Example template
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Storage security rules
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## ⚙️ Environment Variables

Configure your `.env` or `.env.local` file with your credentials:

```bash
# Firebase Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=portfolio-17d5e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=portfolio-17d5e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=portfolio-17d5e.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# EmailJS Configuration (Contact Form)
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=L7O7hK_anwCZk9qP7
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_oq3htjl
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_zkhwbhp
```

---

## 🚀 Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🔒 Firebase Configuration & Deployment

### Step 1: Create an Admin Account in Firebase Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`portfolio-17d5e`).
3. Under **Build**, select **Authentication**.
4. Enable the **Email/Password** sign-in method under the **Sign-in method** tab.
5. In the **Users** tab, click **Add user**:
   - Enter your email and a strong password.
   - Click **Add user**.
6. This will be the credentials used to log into `/admin/login`. There is intentionally no public signup page.

### Step 2: Deploy Firestore Security Rules
1. In the Firebase Console, go to **Firestore Database** -> **Rules**.
2. Copy the contents of [`firestore.rules`](./firestore.rules) and click **Publish**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    match /projects/{projectId} {
      allow read: if resource.data.published == true || isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.name is string;
      allow update, delete: if isAuthenticated();
    }
  }
}
```

### Step 3: Deploy Storage Security Rules
1. In the Firebase Console, go to **Storage** -> **Rules**.
2. Copy the contents of [`storage.rules`](./storage.rules) and click **Publish**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    match /projects/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated() 
        && request.resource.size < 10 * 1024 * 1024 
        && request.resource.contentType.matches('image/.*');
      allow delete: if isAuthenticated();
    }
  }
}
```

---

## 🚀 Deploying to Vercel (Free Plan)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Convert portfolio to Next.js + Firebase CMS"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository (`Jahan-sportfolio-website`).
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
   - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
   - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
5. Click **Deploy**.

### ⚠️ IMPORTANT: Add Your Vercel Domain to Firebase Authorized Domains
After Vercel generates your production domain (e.g. `your-portfolio.vercel.app`):
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Authentication** -> **Settings** -> **Authorized domains**.
3. Click **Add domain** and enter your Vercel URL (e.g., `your-portfolio.vercel.app`).
4. Save changes.

---

## 🛠️ Admin CMS Workflow

1. Navigate to `/admin/login` in your browser.
2. Sign in with your Firebase Authentication email and password.
3. Access the dashboard at `/admin/dashboard`.
4. Click **Seed 6 Projects** if you want to immediately load your existing 6 projects into Firestore.
5. Click **Add Project** to create new projects with custom image uploads to Firebase Storage.
6. Toggle **Published** on/off to immediately show or hide projects on the live portfolio.
