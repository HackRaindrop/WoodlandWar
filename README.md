# 🌲 Woodland War

A web-based adaptation of asymmetric woodland strategy board games for 2-4 players. Built with React, Node.js, MongoDB, Redis, and Handlebars.

## 🎮 Game Overview

Woodland War is an asymmetric strategy game where each player controls a unique faction vying for control of the great woodland. The first player to score **30 victory points** wins!

### Factions

| Faction | Playstyle | Difficulty |
|---------|-----------|------------|
| ⚙️ **Ironwood Collective** | Engine Building | Easy |
| 🦅 **Eyrie Dynasty** | Programming | Medium |
| 🐿️ **Forest Alliance** | Guerrilla | Hard |
| 🦊 **Lone Wanderer** | Adventure | Medium |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Installation

1. **Clone and install dependencies:**
```bash
cd RootWeb
npm run install:all
```

2. **Configure environment:**

Create `server/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/woodland-war
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
```

3. **Start the development servers:**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Rules page: http://localhost:3001/rules

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication

### Backend
- **Express** - Web framework
- **Handlebars** - Server-side templating (rules, about pages)
- **MongoDB/Mongoose** - Database
- **Redis** - Session store & live game state cache
- **Socket.IO** - WebSocket server
- **JWT** - Authentication

## 📁 Project Structure

```
RootWeb/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Game UI components
│   │   ├── pages/         # Route pages
│   │   ├── stores/        # Zustand stores
│   │   └── index.css      # Tailwind styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # DB & Redis config
│   │   ├── game/          # Game engine & factions
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── socket/        # WebSocket handlers
│   │   └── views/         # Handlebars templates
│   └── package.json
└── package.json            # Root package
```

## 🎯 Game Features

### Core Mechanics
- **Asymmetric gameplay** - Each faction plays differently
- **Area control** - Rule clearings to unlock actions
- **Combat** - Dice-based battle system
- **Crafting** - Convert cards into items for VP
- **Deck building** - Shared card deck with multiple uses

### Technical Features
- **Real-time multiplayer** - WebSocket-powered gameplay
- **Session persistence** - Redis-backed sessions
- **Guest play** - No account required to play
- **Responsive design** - Works on desktop and tablets
- **Action logging** - Full game history tracking

## 🃏 How to Play

1. **Create or join a game** from the home page
2. **Select your faction** in the lobby
3. **Ready up** when all players have chosen
4. **Take turns** through three phases:
   - 🌅 **Birdsong** - Start of turn effects
   - ☀️ **Daylight** - Main action phase
   - 🌙 **Evening** - Draw cards and score

### Victory Conditions
- Reach **30 Victory Points**
- Complete a **Dominance** card objective

## 🌐 Deployment

### Heroku

The game is deployed on Heroku. To deploy your own instance:

1. **Create Heroku app:**
```bash
heroku create your-app-name
```

2. **Set environment variables:**
```bash
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set REDIS_HOST=your-redis-host
heroku config:set REDIS_PORT=your-redis-port
heroku config:set REDIS_USERNAME=default
heroku config:set REDIS_PASSWORD=your-redis-password
heroku config:set SESSION_SECRET=your-session-secret
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NODE_ENV=production
```

3. **Deploy:**
```bash
git push heroku main
```

## 🔧 Development

### Running Tests
```bash
cd server && npm test
cd client && npm test
```

### Building for Production
```bash
npm run build
cd server && npm start
```

## 📜 Legal

This is a fan-made adaptation inspired by asymmetric woodland strategy games. All assets are original or generic to avoid copyright issues. This project is not affiliated with any commercial board game publisher.

## 🙏 Credits

- Game design inspired by classic asymmetric board games
- Built with modern web technologies
- Created for family and friends to enjoy together

---

**Happy Gaming! 🎲🌲**
