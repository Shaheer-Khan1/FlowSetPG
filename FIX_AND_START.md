# 🔧 Fix Terminal PATH and Start Server

## The Issue

Your current terminal doesn't have the new Node.js in its PATH yet. The Node.js installation was added to `.bashrc`, but your existing terminal needs to reload it.

## ✅ Quick Solutions

### Option 1: Use the Start Script (Easiest!)

Just run this from the backend directory:

```bash
cd backend
./start.sh
```

Or for simple mode without auto-reload:

```bash
cd backend
./start-simple.sh
```

### Option 2: Reload Your Terminal

Run this command in your current terminal to load the new PATH:

```bash
source ~/.bashrc
```

Then you can use npm commands normally:

```bash
cd backend
npm run dev
```

### Option 3: Open a New Terminal

1. Close your current terminal
2. Open a new terminal
3. The new terminal will automatically have Node.js in PATH

```bash
cd /home/linux/Desktop/FlowSet/FlowSetPG/backend
npm run dev
```

## 🚀 Available Commands

Once your PATH is fixed, you can use:

### Development (with auto-reload using nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm run start
```

### Simple Mode (no auto-reload, just Node.js)
```bash
npm run dev:simple
```

### Using the Scripts
```bash
./start.sh        # Development mode with auto-reload
./start-simple.sh # Simple mode
```

## ✅ Verify Node.js is Working

Check if Node.js is in your PATH:

```bash
which node
# Should show: /home/linux/.local/node/bin/node

node --version
# Should show: v20.11.1

npm --version
# Should show: 10.2.4
```

If these commands don't work, run:

```bash
source ~/.bashrc
```

## 📝 What Changed

- ✅ Installed `nodemon` for better development experience
- ✅ Created `start.sh` and `start-simple.sh` scripts
- ✅ Updated package.json to use nodemon instead of --watch
- ✅ Added `dev:simple` script as fallback

## 🎯 Recommended Next Steps

1. **In your current terminal**, run:
   ```bash
   source ~/.bashrc
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **In a new terminal**, start the frontend:
   ```bash
   cd /home/linux/Desktop/FlowSet/FlowSetPG
   npm run dev
   ```

That's it! Your server should now start without issues. 🚀
