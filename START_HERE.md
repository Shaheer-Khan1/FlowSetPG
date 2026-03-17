# 🚀 Start Your FlowSet Application

Everything is installed and ready! Choose how you want to run it:

## ✅ Quick Start Options

### Option 1: Start Everything at Once (Recommended)

This starts both backend and frontend in one command:

```bash
./start-all.sh
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- Press Ctrl+C to stop both servers

### Option 2: Start Backend Only

```bash
cd backend
./start.sh
```

Or if you already reloaded your terminal:

```bash
cd backend
npm run dev
```

### Option 3: Start Frontend Only

```bash
./start-frontend.sh
```

Or if you already reloaded your terminal:

```bash
npm run dev
```

### Option 4: Start Each in Separate Terminals

**Terminal 1 (Backend):**
```bash
cd /home/linux/Desktop/FlowSet/FlowSetPG/backend
./start.sh
```

**Terminal 2 (Frontend):**
```bash
cd /home/linux/Desktop/FlowSet/FlowSetPG
./start-frontend.sh
```

## 🔧 If You Get "Command Not Found" Errors

Your terminal needs to load the new Node.js. Run this once:

```bash
source ~/.bashrc
```

Or just open a new terminal window.

## 📊 Check System Status

```bash
./status.sh
```

This shows:
- ✅ Docker status
- ✅ PostgreSQL status (should be running)
- ✅ Node.js status
- ✅ Dependencies status

## 🐘 Database Management

### Connect to Database
```bash
./docker-connect.sh
```

### Test Database Connection
```bash
cd backend
npm run test:db
```

### View PostgreSQL Logs
```bash
docker logs flowset-postgres
```

## 📝 Available Scripts

### Root Directory
- `./start-all.sh` - Start both frontend and backend
- `./start-frontend.sh` - Start frontend only
- `./status.sh` - Check system status
- `./docker-start.sh` - Start PostgreSQL
- `./docker-stop.sh` - Stop PostgreSQL
- `./docker-connect.sh` - Connect to database

### Backend Directory (cd backend)
- `./start.sh` - Start backend with auto-reload
- `./start-simple.sh` - Start backend (simple mode)
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run start` - Start production mode
- `npm run test:db` - Test database connection

### Frontend Directory (root)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 Application URLs

Once started:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 🎯 Recommended Workflow

1. **First time / After reboot:**
   ```bash
   cd /home/linux/Desktop/FlowSet/FlowSetPG
   ./status.sh          # Check if PostgreSQL is running
   ./start-all.sh       # Start everything
   ```

2. **During development:**
   - Keep both servers running
   - Changes auto-reload automatically
   - Database stays running in Docker

3. **When done:**
   - Press Ctrl+C to stop servers
   - PostgreSQL keeps running (use `./docker-stop.sh` if needed)

## 🔍 Troubleshooting

### "command not found" errors
```bash
source ~/.bashrc
```

### PostgreSQL not running
```bash
./docker-start.sh
```

### Check what's running
```bash
./status.sh
```

### Reset everything
```bash
./docker-remove.sh  # ⚠️ Deletes database data!
./docker-start.sh
cd backend
npm run test:db
```

### View logs (when using start-all.sh)
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

## 📚 Documentation

- `START_HERE.md` - This file
- `READY_TO_RUN.md` - Complete usage guide
- `FIX_AND_START.md` - Troubleshooting Node.js PATH
- `README_POSTGRES.md` - PostgreSQL guide
- `POSTGRES_SETUP_COMPLETE.md` - Setup details

---

**Ready?** Run `./start-all.sh` and start developing! 🚀
