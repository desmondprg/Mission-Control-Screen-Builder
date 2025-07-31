
# Mission Control Screen Builder – Architecture Overview

---

## 🧩 System Architecture - Overview

```
Frontend (Vite)
React + Zustand + Tailwind
    |
    | HTTP (REST)
    | WebSocket
    v
Backend (Go)
Echo + WebSocket Server
    |
    v
PostgreSQL Database (commands + telemetry)
```

---

## 🧱 Component Breakdown

### Frontend
- **UI Layer**: React, ShadCN UI, Tailwind CSS  
  → Displays `TelemetryBox`, `CommandBox`, `ChartBox`
- **State Management**: Zustand  
  → Manages layout, telemetry signals, calibration, units
- **Drag-and-Drop**: `react-grid-layout`  
  → Supports resizing and repositioning components
- **Telemetry (Live)**: WebSocket (`/ws`)  
  → Real-time updates pushed from backend
- **Historical Data**: Axios + REST  
  → GET `/api/telemetry`
- **Command Dispatch**: Axios + REST  
  → POST `/api/command` with validation, 2FA, feedback

### Backend
- **Web Server**: Go + Echo  
  → API routing, CORS, Swagger setup
- **WebSocket**: `/ws`  
  → Broadcasts live telemetry every second
- **REST API**: `/api/telemetry`, `/api/command`  
  → Handles telemetry queries and command execution
- **Persistence**: PostgreSQL via GORM  
  → Stores command history and telemetry data  
  → *Dashboard layout is not persisted (local only)*
- **Internal Logic**: Goroutines + `math/rand`  
  → Generates telemetry + simulates failures

---

## 🔁 Data Flow Summary

### Telemetry (Live)
```
Frontend -> WebSocket -> Backend: Connect to /ws
Backend -> Frontend: Send telemetry JSON
Frontend: Update UI state
```

### Telemetry (Historical)
```
Frontend -> GET /api/telemetry
Backend -> Query DB -> Respond with JSON
Frontend -> Render in ChartBox
```

### Command Dispatch
```
Frontend -> Validate form input
Frontend -> POST /api/command
Backend -> Save to DB, simulate latency/failure
Backend -> Return 200/500
Frontend -> Show toast notification
```

---

## ⚙️ Architectural Decisions

- **WebSocket for telemetry**: Enables real-time updates with low latency
- **PostgreSQL for persistence**: Reliable storage for telemetry and commands
- **Local-only dashboard layout**: Simplifies config without backend state
- **Zustand over Redux**: Lightweight global state with minimal boilerplate
- **react-grid-layout**: Built-in support for draggable/resizable components
- **Swagger with Echo**: Self-generating REST API documentation

---

## 🚀 Performance Notes & Lessons Learned

### Real-Time Performance
This project demonstrates solid real-time performance for a prototype-scale system. WebSocket streams update live telemetry smoothly and UI components render values without lag. However, because all state updates and chart rendering are handled client-side without virtualization or memoization, the application may experience performance bottlenecks under larger data volumes or longer chart durations. Pagination, chunked rendering, and memoized selectors would be key improvements in a production-scale deployment.

Given more time, I would also implement data downsampling strategies or viewport-aware rendering (especially in historical charts) to prevent unnecessary re-renders and memory usage buildup.

### Time Constraints & Tradeoffs
Due to limited time, some lower-priority backend features like persistent dashboard layout storage and anomaly simulation were intentionally skipped. I prioritized implementing and polishing the core user experience—drag-and-drop layout, command execution, real-time telemetry updates, and charting—because these were most critical to meeting the challenge requirements.

The decision to store dashboard configs in local state (with file export/import) offered a pragmatic tradeoff: full usability without extra backend complexity. This approach also supports portability, as layouts can be saved to and loaded from disk in any environment. If given more time, I would extend this functionality to support user-specific persistence through a REST endpoint backed by the existing PostgreSQL database.

### Lessons Learned
- Echo + Swagger is a fast and lightweight way to scaffold RESTful APIs in Go, but annotations must be tightly maintained to avoid tag bloat or missing descriptions.
- Zustand provides excellent ergonomics for medium-complexity state management in React—especially when avoiding the boilerplate of Redux.
- Prioritizing feature completeness and polish over breadth proved valuable in a short-timeline project. A few solid, working features communicated ability far better than half-finished extras.
- Browser-based layout saving (via the File System API) proved more flexible than expected and would be viable even in future offline-first applications.
- I’m fully aware that committing .env files to a repository is a security risk in production environments. However, for the purposes of this isolated take-home assignment, I chose to include .env files in the repo to ensure the project can be run quickly and smoothly without additional setup. This approach prioritizes developer convenience and reproducibility, allowing reviewers to launch the app and test all functionality out of the box with docker-compose up. In a production setting, sensitive credentials would be managed via secure secrets management tools or CI/CD-level environment injection.

One major takeaway from building this project is the importance of maintaining a **modular backend architecture**. While the initial implementation placed all logic into a single `main.go` file for simplicity, this **monolithic structure** quickly became a bottleneck for scalability, readability, and maintainability.

If I were to revisit or expand this application, I would refactor the backend into clearly defined packages:

- **`handlers/`** – API request handlers  
- **`models/`** – GORM models and database logic  
- **`routes/`** – Route definitions and registration  
- **`websocket/`** – WebSocket upgrade logic and telemetry stream  
- **`docs/`** – Swagger auto-generated documentation  

By applying this **separation of concerns**, the codebase would become more organized, testable, and easier to navigate—especially as new features are added. Adopting a more idiomatic Go project structure would also help with onboarding collaborators and reducing potential bugs during future iterations.

