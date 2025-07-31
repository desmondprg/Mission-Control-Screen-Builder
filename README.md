# 🚀 Mission Control – Full Stack Telemetry Dashboard

This is a full-stack project for building and saving customizable telemetry dashboards. It uses a modern stack and comes preconfigured to run entirely in Docker.

---

## 📦 Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Go (Echo, GORM)
- **Database:** PostgreSQL
- **Containerization:** Docker + Docker Compose
- **API Docs:** Swagger

---

## 🖥️ Prerequisites

Make sure you have the following installed on your system:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop)**
    - Required to run containers
    - Ensure Docker is running before you continue

2. **Ports 5173, 8080, and 5432 must be free**
    - Used for the frontend, backend, and database respectively

---

## ⚙️ Project Structure

```
mission-control/
├── docker-compose.yml            # Orchestrates backend and frontend containers

├── backend/                      # Go backend server (Echo framework)
│   ├── main.go                  # Core backend application with all API endpoints and WebSocket
│   ├── .env                     # Environment variables for DB connection
│   ├── .env.example             # Sample .env config
│   ├── Dockerfile              # Backend Dockerfile
│   ├── entrypoint.sh           # Startup script used by container
│   ├── go.mod                  # Go module metadata
│   ├── go.sum                  # Dependency checksums
│   └── docs/                   # Swagger documentation served at /swagger
│       ├── index.html         # Swagger UI entry point
│       └── swagger.yaml       # OpenAPI spec for REST APIs

├── frontend/                     # React + Vite frontend
│   ├── .env                     # Local frontend environment variables
│   ├── .env.example             # Sample frontend .env file
│   ├── Dockerfile              # Frontend Dockerfile
│   ├── index.html              # HTML entry point for Vite
│   ├── package.json            # NPM dependencies and scripts
│   ├── package-lock.json       # NPM lockfile
│   ├── tailwind.config.js      # TailwindCSS config
│   ├── postcss.config.js       # CSS processor config
│   ├── vite.config.ts          # Vite config for frontend build/dev
│   └── src/                    # Application source code
│       ├── index.css           # Global styles
│       ├── main.tsx           # Mounts React app to DOM
│       ├── components/         # All major UI components
│       │   ├── App.tsx               # Main wrapper for Sidebar + Dashboard
│       │   ├── Dashboard.tsx         # Handles grid layout and rendering of dropped components
│       │   ├── Sidebar.tsx           # Sidebar for dragging components and adjusting settings
│       │   ├── CommandBox.tsx        # Command form with validation and 2FA confirmation
│       │   ├── TelemetryBox.tsx      # Real-time telemetry display with stale/threshold indicators
│       │   └── ChartBox.tsx          # Historical telemetry chart using Recharts
│       └── store/
│           └── useStore.ts          # Zustand state store: layout, telemetry, user settings

```

---

## 📥 Cloning and Running the App

```bash
git clone https://github.com/desmondprg/Mission-Control-Screen-Builder.git
cd <mission-control>
docker-compose up --build
```

---

## 🌐 Access the App

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Database (PostgreSQL):** running at `db:5432` inside Docker

---

## 🔐 Environment Variables

### backend/.env
```
PORT=8080
DATABASE_URL=postgres://your_user:your_password@db:5432/your_db?sslmode=disable
```

### frontend/.env
```
VITE_API_URL=http://localhost:8080
```

---

## 🧹 Clean Up

To stop and remove all containers **but keep data**:
```bash
docker-compose down
```

To stop and remove containers **and** all volumes (wipe DB):
```bash
docker-compose down -v
```

---

## 🧪 Useful Docker Commands

| Command                                | Description                              |
|----------------------------------------|------------------------------------------|
| `docker-compose up --build`            | Build and start all services             |
| `docker-compose logs backend`          | View backend logs                        |
| `docker ps`                            | List running containers                  |
| `docker-compose down -v`               | Stop everything and remove all volumes   |

---

## 🧪 Running Backend Tests

To run all backend tests inside the Docker container using the test PostgreSQL database:

```bash
docker-compose exec backend go test -v
```


---

## 🛠 Future Ideas

- Implement user auth
- Set up CI/CD deployment

---

## 📂 Accessing the PostgreSQL Database

To enter the PostgreSQL shell from Docker, run:

```bash
docker exec -it dockerp-db-1 psql -U your_user -d your_db
```

Replace `your_user` with your PostgreSQL user (e.g., `postgres` or `myuser`), and `your_db` with the name of your database. (See your docker-compose.yml for details)

Once inside the `psql` shell, use the following commands to explore and interact with your data:

| Command                | Purpose                           |
|------------------------|-----------------------------------|
| `\l`                   | List all databases                |
| `\c my_db`             | Connect to a database             |
| `\dt`                  | List all tables                   |
| `\d table_name`        | Describe structure of a table     |
| `SELECT * FROM table`  | Query all rows in a table         |
| `\q`                   | Exit the PostgreSQL shell         |

### Common Queries

- View recent telemetry values:
  ```sql
  SELECT * FROM telemetry_data ORDER BY time DESC LIMIT 5;
  ```

- Filter by signal type:
  ```sql
  SELECT * FROM telemetry_data WHERE signal = 'temp' ORDER BY time DESC LIMIT 5;
  ```

---
