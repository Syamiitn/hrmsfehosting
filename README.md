HRMS-FE-REACT-V1

Frontend repository for HRMS application (React + Vite + Tailwind).

🚀 Tech Stack

React 19 + Vite 7

Tailwind CSS 4 (with PostCSS & Autoprefixer)

React Router v7

ESLint for linting

Inter font (default typography)

🛠️ Setup Instructions
1. Clone the Repository
git clone https://github.com/SogoDesk/HRMS-FE-REACT-V1.git
cd HRMS-FE-REACT-V1

2. Checkout to DEV Branch
git checkout DEV

3. Create Your Own Feature Branch

Follow branch naming conventions (from Vinay’s email):

For new features: feat-activity_name

For enhancements: enhance-activity_name

For bug fixes: fix-activity_name

Example:

git checkout -b feat-loginpage

4. Install Dependencies
npm install

5. Run Development Server
npm run dev


Your app should now be running on: http://localhost:5173/

6. Build for Production
npm run build

7. Preview Production Build
npm run preview

🎨 Tailwind & Theme Setup

Tailwind config includes:

Theme Colors (theme.violet, theme.blue, theme.rose, theme.green, theme.orange)

Custom Gray Palette (grayCustom.100 → grayCustom.900)

Typography Utilities (text-h1 → text-h6, text-p1 → text-p4)

Example Usage
<h1 className="text-h1 font-inter text-theme-violet">Dashboard</h1>
<p className="text-p3 text-grayCustom-700">Welcome to HRMS</p>
<div className="bg-theme-blue dark:bg-theme-green">Sidebar</div>

🔄 Pull Request (PR) Guidelines

Always pull latest from DEV before creating your branch.

Add a clear PR comment summarizing your changes.

Assign at least one reviewer.

Add assignees if dependencies exist.

Example:
fix-loginpage — "Resolved OTP validation bug; applied same fix in signup flow"

📂 Folder Structure
HRMS-FE-REACT-V1/
│── src/
│   ├── assets/         # Images, fonts, icons
│   ├── components/     # Reusable React components
│   ├── context/        # React Contexts (Theme, Auth, etc.)
│   ├── pages/          # Page-level components
│   ├── hooks/          # For developing custom hooks
│   ├── config/         # To maintain menu, tab etc link from here
│   ├── layout/         # To maintain all portals layouts
│   ├── routes/         # To maintain routes seperatly 
│   ├── utils/          # 
│   ├── data/           # To manage mock data
│   ├── App.jsx
│   └── main.jsx
│── public/             # Static files
│── tailwind.config.js  # Tailwind configuration
│── postcss.config.js   # PostCSS setup
│── package.json
│── README.md

✅ Best Practices

Use Tailwind classes instead of writing redundant CSS.

Maintain branch discipline (no direct push to DEV/QA/UAT/PROD).

Keep PRs small and descriptive.

Follow typography and theme guidelines for consistency.