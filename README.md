# ExamSecure — Online Examination & Proctoring Platform

ExamSecure is an enterprise-grade, privacy-conscious online examination and automated proctoring platform built with **React 19**, **Node.js (Express)**, **Tailwind CSS**, and a **PostgreSQL / Prisma** compliant relational architecture.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Student:** View scheduled exams, perform pre-exam hardware checks, take timed exams with continuous autosave, and view released results with conceptual feedback.
   - **Teacher / Faculty:** Create & manage question banks (MCQ single, MCQ multi-select, True/False, Short Answer, Descriptive), configure exam schedules & proctoring policies, manually grade descriptive essay submissions, and supervise active exams in the live proctoring room.
   - **Administrator:** Global user provisioning, audit trail logging, platform health metrics, and database lifecycle management.

2. **Webcam & Audio Proctoring (MediaDevices & WebRTC-ready):**
   - Transparent pre-exam hardware check modal with live camera preview and microphone audio volume meter.
   - Floating proctor widget during exams with live status badges.
   - Real-time event tracking: Fullscreen exits, tab/window switching, camera loss, and suspicious audio spikes.
   - Live Teacher Monitoring Room for supervising connected candidate feeds in real time.
   - Teacher timeline for reviewing flagged events with `CLEARED` or `FLAGGED` decisions.

3. **Timed Examination Interface:**
   - Server-deadline synchronized countdown timer.
   - Resilient autosave with millisecond timestamp confirmation and reconnection recovery.
   - Question Navigator Palette with status colors: Answered, Marked for Review, Visited, and Unvisited.
   - Automatic submission on deadline expiration.

4. **Evaluation Engine & Analytics:**
   - Instant automated grading for single choice, multiple select (with negative marking penalty rules), true/false, and exact keyword short answers.
   - Manual grading workflow for descriptive responses with teacher written feedback.
   - Interactive charts via **Recharts**: score distribution histograms, subject performance bars, and proctoring violation frequencies.
   - One-click CSV export of candidate examination results.

---

## 💻 Windows Terminal Prerequisites & Verification

Open VS Code Terminal (`Ctrl + ~`) in PowerShell or Command Prompt:

### 1. Check Node.js and npm
```powershell
node -v
npm -v
```
*(Recommended: Node.js v18 or v20+)*

### 2. Check Git
```powershell
git --version
```

### 3. Check PostgreSQL (Optional for Local Server)
```powershell
psql --version
```

---

## 🚀 Quick Start (Development)

```powershell
# 1. Install dependencies
npm install

# 2. Start the Full-Stack Server (Express API + Vite React on port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔑 Demo Accounts (1-Click Switcher Available in UI)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@examsecure.io` | `Admin@123` | Dr. Arthur Vance (Dean) |
| **Teacher** | `teacher@examsecure.io` | `Teacher@123` | Prof. Elena Rostova |
| **Student** | `student@examsecure.io` | `Student@123` | Mohit Mathur (CS2026-0491) |
| **Student 2** | `jane.doe@examsecure.io` | `Student@123` | Jane Doe (Evaluated sample) |

*Tip: Use the top bar in the app for instant 1-click role switching between all 3 personas without retyping credentials.*

---

## 🗄️ Database Architecture (Prisma & PostgreSQL)

The schema is defined in `prisma/schema.prisma` with 11 relational models:
- `User`
- `Subject`
- `Question` & `QuestionOption`
- `Exam` & `ExamQuestion`
- `ExamAttempt` & `SubmittedAnswer`
- `ProctoringEvent`
- `AuditLog`

To run migrations against a dedicated PostgreSQL database:
```powershell
npx prisma migrate dev --name init
```
