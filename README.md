# TaskFlow 🚀

A production-ready, lightweight project management app (MERN Stack) — similar to Jira/Trello.

![TaskFlow Dashboard](screenshot-placeholder.png)

## ✨ Features

- **JWT Authentication** — Signup/Login with bcrypt password hashing
- **Role-Based Access Control (RBAC)** — Admin and Member roles with distinct permissions
- **Project Management** — Create, manage, and delete projects with team members
- **Task Board** — Kanban-style board with drag-and-drop (dnd-kit)
- **Dashboard** — Stats overview with recharts visualizations
- **Responsive UI** — Dark theme, clean Tailwind-based design

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts, dnd-kit |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

## 🏗️ Project Structure

```
taskflow/
├── backend/
│   ├── controllers/       # Business logic
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── dashboardController.js
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/            # Express routers
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── middleware/        # Auth + error handling
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/    # Layout, Modal, Badge
        ├── context/       # AuthContext
        ├── pages/         # Dashboard, Projects, TaskBoard, etc.
        └── utils/         # Axios instance
```

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm install
npm run dev       # Starts on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm start         # Starts on port 3000 (proxies API to 5000)
```

## 🔌 API Documentation

### Auth
| Method | Endpoint | Access | Body |
|--------|----------|--------|------|
| POST | `/api/auth/signup` | Public | `{ name, email, password, role }` |
| POST | `/api/auth/login` | Public | `{ email, password }` |
| GET | `/api/auth/me` | Protected | — |
| GET | `/api/auth/users` | Protected | — |

### Projects
| Method | Endpoint | Access | Body |
|--------|----------|--------|------|
| GET | `/api/projects` | Protected | — |
| GET | `/api/projects/:id` | Protected | — |
| POST | `/api/projects` | Admin | `{ name, description }` |
| POST | `/api/projects/:id/members` | Admin | `{ userId }` |
| DELETE | `/api/projects/:id/members/:userId` | Admin | — |
| DELETE | `/api/projects/:id` | Admin | — |

### Tasks
| Method | Endpoint | Access | Body |
|--------|----------|--------|------|
| GET | `/api/tasks/project/:projectId` | Member+ | — |
| POST | `/api/tasks` | Member+ | `{ title, description, projectId, assignedTo, priority, dueDate }` |
| PATCH | `/api/tasks/:id` | Member+ (status only for Member) | `{ title, status, priority, ... }` |
| DELETE | `/api/tasks/:id` | Admin | — |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/dashboard` | Protected |

## 🔐 RBAC Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create task | ✅ | ✅ |
| Assign task | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Delete task | ✅ | ❌ |

## 🚢 Railway Deployment

### Backend

1. Create a new Railway project
2. Connect your GitHub repo, select the `backend` folder
3. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key_here
   CLIENT_URL=https://your-frontend.railway.app
   PORT=5000
   ```

### Frontend

1. Add another service in Railway, select `frontend` folder
2. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
3. Railway auto-detects React and runs `npm run build`

## 🗃️ Database Schema

### User
```js
{ name, email, password (hashed), role: ["Admin"|"Member"] }
```

### Project
```js
{ name, description, createdBy: UserId, members: [UserId] }
```

### Task
```js
{
  title, description, projectId, assignedTo: UserId,
  createdBy: UserId, status: ["Todo"|"In Progress"|"Done"],
  priority: ["Low"|"Medium"|"High"], dueDate
}
```

## ⚡ Bonus Features Implemented

- ✅ Drag & Drop Kanban (dnd-kit)
- ✅ Search/filter tasks
- ✅ Overdue task highlighting
- ✅ Priority color coding
- ✅ Dashboard charts (Recharts PieChart + BarChart)
- ✅ Responsive mobile layout

## 📄 License

MIT
