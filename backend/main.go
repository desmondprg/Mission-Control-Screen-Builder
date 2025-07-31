package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	// Swagger
	"mission-control/docs"

	echoSwagger "github.com/swaggo/echo-swagger"
)

// @title Mission Control API
// @version 1.0
// @description API for Mission Control Screen Builder Take-Home Challenge.
// @BasePath /

// Param is a single key-value input for a command
type Param struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// Command model
type Command struct {
	ID        uint    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string  `json:"name"`
	Code      string  `json:"code"`
	Status    string  `json:"status"`
	Hazardous bool    `json:"hazardous"`
	Params    []Param `json:"params" gorm:"type:jsonb"`
}

// TelemetryData is saved in DB
type TelemetryData struct {
	ID     uint      `json:"id" example:"1"`
	Signal string    `json:"signal" example:"temp"`
	Value  float64   `json:"value" example:"72.5"`
	Time   time.Time `json:"time" example:"2025-07-27T19:00:00Z"`
}

// DashboardConfig saves layout config
type DashboardConfig struct {
	ID         uint   `json:"id" example:"1"`
	Name       string `json:"name" example:"Main Dashboard"`
	JsonConfig string `json:"jsonConfig" example:"{\"layout\":[], \"components\":[]}" `
}

// TelemetryMessage is used only for Swagger documentation of the WebSocket payload
// @Description Example telemetry message structure sent via WebSocket
// @Tags WebSocket
type TelemetryMessage struct {
	Temp     float64 `json:"temp" example:"98.6"`
	Pressure float64 `json:"pressure" example:"29.92"`
	Voltage  float64 `json:"voltage" example:"3.3"`
	Time     string  `json:"time" example:"2025-07-31T12:00:00Z"`
	Status   string  `json:"status" example:"OK"`
}

var db *gorm.DB

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	var err error
	if err := godotenv.Load("/app/.env"); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Connected to database successfully")

	err = db.AutoMigrate(&DashboardConfig{}, &Command{}, &TelemetryData{})
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}
	db.Exec("ALTER TABLE commands ADD COLUMN IF NOT EXISTS params jsonb;")

	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
	}))

	// ✅ Swagger UI
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	// ✅ Set Swagger host and scheme
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.Schemes = []string{"http"}

	// Routes
	e.GET("/", healthCheck)
	e.POST("/api/dashboard", saveDashboard)
	e.GET("/api/dashboard", getDashboards)
	e.GET("/api/telemetry", getTelemetry)
	e.POST("/api/command", postCommand)
	e.GET("/ws/telemetry", telemetryWebSocket)

	log.Println("Starting telemetry simulation in background...")
	go simulateTelemetry()

	log.Println("Server running on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}

// @Summary Health check
// @Description Returns a simple message indicating the API is running
// @Tags Default
// @Produce plain
// @Success 200 {string} string "Mission Control Backend is running"
// @Router / [get]
func healthCheck(c echo.Context) error {
	return c.String(http.StatusOK, "Mission Control Backend is running")
}

// @Summary Get latest telemetry data
// @Description Returns recent telemetry readings grouped by time
// @Tags Telemetry
// @Produce json
// @Success 200 {array} map[string]interface{} "Telemetry data"
// @Router /api/telemetry [get]
func getTelemetry(c echo.Context) error {
	startStr := c.QueryParam("start")
	endStr := c.QueryParam("end")

	var startTime, endTime time.Time
	var err error

	if startStr != "" {
		startTime, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid start time format"})
		}
	}

	if endStr != "" {
		endTime, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid end time format"})
		}
	}

	signal := c.QueryParam("signal")
	var telemetry []TelemetryData

	query := db.Order("time desc").Limit(300)
	if !startTime.IsZero() && !endTime.IsZero() {
		query = query.Where("time BETWEEN ? AND ?", startTime, endTime)
	}
	if signal != "" {
		query = query.Where("signal = ?", signal)
	}

	result := query.Find(&telemetry)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
	}

	grouped := make(map[string]map[string]float64)
	for _, t := range telemetry {
		key := t.Time.Format(time.RFC3339)
		if grouped[key] == nil {
			grouped[key] = map[string]float64{}
		}
		grouped[key][t.Signal] = t.Value
	}

	var combined []map[string]interface{}
	for k, v := range grouped {
		entry := map[string]interface{}{"time": k}
		for sig, val := range v {
			entry[sig] = val
		}
		combined = append(combined, entry)
	}

	return c.JSON(http.StatusOK, combined)
}

// @Summary Send command
// @Description Execute a command. Hazardous commands require a 6-digit 2FA code.
// @Tags Commands
// @Accept json
// @Produce json
// @Param command body Command true "Command to execute"
// @Success 200 {object} Command
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/command [post]
func postCommand(c echo.Context) error {
	cmd := new(Command)
	if err := c.Bind(cmd); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}

	if cmd.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "command name required"})
	}

	if cmd.Hazardous {
		if len(cmd.Code) != 6 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Hazardous commands require a 6-digit 2FA code"})
		}
	}

	// Optional: reject malformed param keys
	for _, p := range cmd.Params {
		if p.Key == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Each parameter must have a key"})
		}
	}

	// Simulate random failure
	time.Sleep(1 * time.Second)
	if rand.Float64() < 0.2 {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "simulated command failure",
		})
	}

	cmd.Status = "SUCCESS" // set status before saving

	log.Printf("📦 Final command payload: %+v\n", cmd)

	if err := db.Create(cmd).Error; err != nil {
		log.Println("❌ DB ERROR:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save command"})
	}

	return c.JSON(http.StatusOK, cmd)
}

// @Summary Save a dashboard configuration
// @Description Save user dashboard layout and settings
// @Tags Dashboard
// @Accept json
// @Produce json
// @Param dashboard body DashboardConfig true "Dashboard configuration"
// @Success 200 {object} DashboardConfig
// @Failure 400 {object} map[string]string
// @Router /api/dashboard [post]
func saveDashboard(c echo.Context) error {
	cfg := new(DashboardConfig)
	if err := c.Bind(cfg); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	if cfg.Name == "" || cfg.JsonConfig == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name and JsonConfig required"})
	}
	db.Create(cfg)
	return c.JSON(http.StatusOK, cfg)
}

// @Summary Get saved dashboards
// @Description Retrieve all saved dashboard configurations
// @Tags Dashboard
// @Produce json
// @Success 200 {array} DashboardConfig
// @Failure 500 {object} map[string]string
// @Router /api/dashboard [get]
func getDashboards(c echo.Context) error {
	var configs []DashboardConfig
	result := db.Find(&configs)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
	}

	validConfigs := []DashboardConfig{}
	for _, cfg := range configs {
		if cfg.JsonConfig != "" && json.Valid([]byte(cfg.JsonConfig)) {
			validConfigs = append(validConfigs, cfg)
		}
	}
	return c.JSON(http.StatusOK, validConfigs)
}

// @Summary Connect to Telemetry WebSocket
// @Description Upgrade to a WebSocket for real-time telemetry streaming. Sends JSON messages every second.
// @Tags WebSocket
// @Produce json
// @Success 101 {string} string "WebSocket Upgrade Successful"
// @Success 200 {object} TelemetryMessage "Example telemetry message"
// @Router /ws/telemetry [get]
func telemetryWebSocket(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		t := map[string]interface{}{
			"temp":     rand.Float64()*100 + 50,
			"pressure": rand.Float64()*50 + 10,
			"voltage":  rand.Float64()*5 + 1,
			"time":     time.Now().Format(time.RFC3339),
			"status":   "OK",
		}
		msg, _ := json.Marshal(t)
		if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
	return nil
}

func simulateTelemetry() {
	for {
		signals := []string{"temp", "pressure", "voltage"}
		for _, s := range signals {
			db.Create(&TelemetryData{
				Signal: s,
				Value:  rand.Float64() * 100,
				Time:   time.Now(),
			})
		}
		time.Sleep(2 * time.Second)
	}
}
