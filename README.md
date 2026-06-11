<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js-16.2-black.svg?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green.svg?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Ready-blue.svg?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AI-Gemini_%7C_Groq-orange.svg?style=for-the-badge&logo=google" alt="AI" />

  <h1>🕌 MadrasahAI</h1>
  <p><strong>Empowering Madrasah Educators with Next-Generation AI Tools</strong></p>
</div>

---

**MadrasahAI** is a comprehensive, AI-powered educational platform designed specifically for Madrasah teachers (Guru) and principals (Kepala Madrasah). By leveraging cutting-edge Large Language Models (LLMs) like **Google Gemini** and **Groq**, MadrasahAI automates and enhances the creation of high-quality learning materials, saving educators hundreds of hours.

<br/>

## 🌟 Why MadrasahAI?
- **🧠 Intelligent Assistance**: Automatically generate complex materials like RPPs, Rubrics, and Syllabuses tailored to specific subjects and grades.
- **📊 Centralized Management**: Equip Principals with a bird's-eye view of school productivity, teacher activity, and document generation metrics.
- **⚡ Blazing Fast**: Built on modern tech stacks (Next.js 16 + Tailwind CSS v4) ensuring an ultra-responsive user experience.
- **📄 Universal Export**: Instantly export AI-generated content to `.docx`, `.pdf`, `.xlsx`, or `.pptx`.

---

## ✨ Key Features

### 👨‍🏫 For Teachers (Guru)
*Focus on teaching, let AI handle the administration.*
- 📝 **Multiple Choice Questions (Soal PG)** — Generate topic-specific questions with answer keys.
- 📚 **Syllabus & Unit Plans (Silabus & RPP)** — Create complete semester/yearly plans in seconds.
- 🎯 **Rubrics (Rubrik Penilaian)** — Detailed grading criteria for any assignment.
- 📑 **Worksheets (LKS)** — Engaging student exercises.
- 📊 **Presentations** — Generate structured slide content automatically.
- ✍️ **Writing Feedback** — AI-driven analysis of student essays.

### 👨‍💼 For Principals (Kepala Madrasah)
*Data-driven insights to lead your Madrasah effectively.*
- 📈 **Real-time Analytics**: Monitor total generated documents and active teachers.
- 🔐 **Access Control**: Approve or reject new teacher registrations securely.
- 📋 **Activity Logs**: Track recent document generation activities across the school.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (`pg` module) |
| **AI Integrations** | Google Generative AI SDK, Groq SDK |
| **Document Processing** | `docx`, `pdfkit`, `exceljs`, `pptxgenjs` |
| **Security** | JWT Authentication, bcrypt password hashing |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 📋 Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### 🗄️ 1. Database Setup
1. Create a new PostgreSQL database (e.g., `db_madrasah`).
2. Run the SQL scripts in the `Database/` folder:
   - `madrasah.sql` (Main Schema)
   - `create_worksheets_table.sql` (Updates)

### ⚙️ 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend/` directory:
```env
PORT=3000
DB_HOST=localhost
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_key
GROQ_API_KEY=your_groq_api_key
```
Start the development server:
```bash
npm run dev
```

### 🎨 3. Frontend Setup
```bash
cd frontend-web
npm install
```
Create a `.env.local` file in the `frontend-web/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```
Start the development server:
```bash
npm run dev
```
*The frontend will typically run on `http://localhost:3001` or `http://localhost:3000`.*

---

<div align="center">
  <p>Built with ❤️ for Indonesian Madrasahs.</p>
</div>