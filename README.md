# 🎮 Gaming Player Profile Management (Redis Strings Engine)

A full-stack web application for managing gaming player profiles built with **React (Vite)**, **Node.js (Express)**, **Redis**, and **Tailwind CSS**.

The application uses **Redis Strings exclusively** for all data storage, profile serialization, temporary boosts with TTL expiration, and direct string appending.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons
- **Backend**: Node.js, Express, TypeScript (MVC Architecture)
- **Database**: Redis (ioredis driver with auto-reconnecting fallback in-memory string engine)
- **Styling**: Tailwind CSS with custom gaming theme

---

## 🗄️ Redis Strings Storage Protocol

Each player profile is stored as a single **Pipe-Delimited String** in Redis.

### Key Pattern
`player_data:<PLAYER_ID>` (e.g., `player_data:P001`)

### Value Format
`ID|Username|Level|HighScore|Achievement1,Achievement2...`

#### Example Entry
- **Key**: `player_data:P001`
- **Value**: `P001|GamerX|15|9800|First Win,Level Master`

---

## ⚡ Redis Commands Implemented

### 1. Store a Player Profile (`SET`)
Stores a player profile in Redis as a serialized string key.
```bash
# Redis CLI
SET player_data:P001 "P001|GamerX|15|9800|First Win,Level Master"
```
- **API Endpoint**: `POST /player`

---

### 2. Retrieve a Player Profile (`GET`)
Retrieves the raw pipe-delimited string from Redis and parses it into structured fields.
```bash
# Redis CLI
GET player_data:P001
```
- **API Endpoint**: `GET /player/:id`

---

### 3. Store Multiple Players (`MSET`)
Preloads the 3 default required player profiles atomically in a single Redis network request.
```bash
# Redis CLI
MSET player_data:P001 "P001|GamerX|15|9800|First Win,Level Master" player_data:P002 "P002|Shadow|20|12500|First Win,Champion" player_data:P003 "P003|Blaze99|10|7600|Quick Learner,High Jumper"
```
- **API Endpoint**: `POST /players/preload`

#### Preloaded Default Players:
- `player_data:P001` -> `P001|GamerX|15|9800|First Win,Level Master`
- `player_data:P002` -> `P002|Shadow|20|12500|First Win,Champion`
- `player_data:P003` -> `P003|Blaze99|10|7600|Quick Learner,High Jumper`

---

### 4. Temporary Boost (`SETEX`)
Activates a 60-second temporary boost for a player using Redis Time-To-Live (TTL).
```bash
# Redis CLI
SETEX boost:P001 60 "XP_MULTIPLIER_2X|ACTIVATED"
```
- **API Endpoint**: `POST /player/:id/boost`

---

### 5. Append Achievement (`APPEND`)
Appends a new achievement string directly onto the existing Redis string value without having to rewrite the entire key.
```bash
# Redis CLI
APPEND player_data:P001 ",High Jumper"
```
- **API Endpoint**: `POST /player/:id/achievement`

---

### 6. Delete Player Profile (`DEL`)
Removes the player profile key and any associated boost key from Redis.
```bash
# Redis CLI
DEL player_data:P001
DEL boost:P001
```
- **API Endpoint**: `DELETE /player/:id`

---

## 🛠️ REST API Reference Guide

| Method | Endpoint | Description | Redis Command |
| :--- | :--- | :--- | :--- |
| `POST` | `/player` | Store new player profile | `SET` |
| `GET` | `/player/:id` | Get player profile by ID | `GET` |
| `GET` | `/players` | List all players | `KEYS player_data:*` + `GET` |
| `POST` | `/players/preload` | Preload 3 default player profiles | `MSET` |
| `POST` | `/player/:id/boost` | Activate 60s temporary boost | `SETEX` |
| `POST` | `/player/:id/achievement` | Append new achievement string | `APPEND` |
| `DELETE` | `/player/:id` | Delete player profile | `DEL` |
| `GET` | `/api/redis/logs` | Fetch live Redis operation logs | Inspection API |
| `GET` | `/api/redis/keys` | Fetch active Redis keys & TTLs | Inspection API |

---

## 💻 Local Setup & Running Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Runs both the Express API server and Vite frontend on port 3000:
```bash
npm run dev
```

### 3. Production Build
Builds frontend static assets and bundles `server.ts` into `dist/server.cjs`:
```bash
npm run build
```

### 4. Production Start
```bash
npm start
```

---

## 🏗️ MVC Directory Structure

```
├── server/
│   ├── controllers/
│   │   ├── playerController.ts   # Player REST API handlers
│   │   └── redisController.ts    # Redis Inspector API handlers
│   ├── services/
│   │   └── redisService.ts       # Serialization & Redis business logic
│   ├── routes/
│   │   ├── playerRoutes.ts       # Player routes (/player, /players/preload, etc.)
│   │   └── redisRoutes.ts        # Redis inspection routes (/redis/logs, etc.)
│   └── utils/
│       └── redisClient.ts        # Redis wrapper with log stream & comments
├── src/
│   ├── components/
│   │   ├── Navbar.tsx            # Header navigation & inspector launcher
│   │   ├── PlayerCard.tsx        # Player card with 60s boost timer
│   │   └── RedisConsoleModal.tsx # Redis live command stream & key inspector
│   ├── pages/
│   │   ├── HomePage.tsx          # Players list & search
│   │   ├── AddPlayerPage.tsx     # Add player form (SET)
│   │   └── PlayerDetailsPage.tsx # View details, boost (SETEX), append (APPEND), delete (DEL)
│   ├── services/
│   │   └── api.ts                # Frontend API client
│   ├── App.tsx                   # Main React app & router
│   ├── main.tsx                  # React entry point
│   └── types.ts                  # TypeScript interfaces
├── README.md                     # Documentation
├── package.json                  # Scripts & dependencies
└── server.ts                     # Express server entry point
```
