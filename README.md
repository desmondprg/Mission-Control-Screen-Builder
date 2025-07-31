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
├── MissionControl_Architecture.md      # Explanation of project architecture and design decisions
├── MissionControl_Diagram.png          # Visual diagram of system architecture
├── README.md                           # Project overview and setup instructions
├── docker-compose.yml                  # Docker configuration for frontend and backend services
├── backend/
│   ├── .env                            # Runtime environment variables (development use)
│   ├── .env.example                    # Example env file
│   ├── Dockerfile                      # Docker build instructions for backend
│   ├── entrypoint.sh                   # Backend container entrypoint
│   ├── go.mod                          # Go module definition
│   ├── go.sum                          # Go dependencies lockfile
│   ├── main.go                         # Main application with all API and WebSocket handlers
│   ├── main_test.go                    # Backend unit tests
│   └── docs/
│       ├── docs.go                     # Auto-generated Swagger docs binding
│       ├── swagger.json                # Swagger spec (JSON)
│       └── swagger.yaml                # Swagger spec (YAML)
├── frontend/
│   ├── .env                            # Frontend runtime environment variables
│   ├── .env.example                    # Example frontend env file
│   ├── Dockerfile                      # Docker build for frontend
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Frontend dependencies
│   ├── package-lock.json              # Dependency lock file
│   ├── postcss.config.js              # PostCSS config
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── vite.config.ts                 # Vite build configuration
│   ├── node_modules/                  # Installed node dependencies (excluded from version control)
│   └── src/
│       ├── components/                # React components (e.g. CommandBox, ChartBox, TelemetryBox)
│       ├── hooks/                     # Custom React hooks
│       ├── store/                     # Zustand state management store
│       └── types/                     # TypeScript types and interfaces


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
