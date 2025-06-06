# PrepMate

**PrepMate** is a full-stack web platform designed to simulate real-time technical interview experiences. It combines video calling, live collaborative coding, and real-time feedback to help candidates prepare for interviews more effectively.

---

## 🚀 Features

### 1. Real-Time Video Calling (WebRTC + Socket.IO)
### 2. Live Collaborative Code Editor
### 3. Real-Time Notifications
### 4. User Authentication & Management
### 5. Mock Interview Scheduler
### 6. Frontend Tech
- React.js + Tailwind CSS
- Redux Toolkit for state management
- Toast notifications via `react-toastify`

### 🌐 7. Backend Tech
- Express.js with CORS and Cookie Parser
- MongoDB (Mongoose ODM)
- Namespaced WebSocket logic for modular communication

### ⚙️ 8. Socket.IO Namespaces
- `/interview` → Video calling
- `/code-edit` → Live code collaboration
- `/notification` → Realtime alerts

---

## 🛠 Setup Instructions

### Backend
```bash
cd backend
npm install
node index.js
```


## 🧪 Future Improvements
- [ ] Role-based logic (Admin / Interviewer / Candidate)
- [ ] Chat integration (text chat during interview)
- [ ] Room history & session resume
- [ ] Feedback and scoring system post-interview

---

## 👨‍💻 Developed by
**Ankit Singh Chauhan**
---

> PrepMate — Practice smart. Get interview-ready!
