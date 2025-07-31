package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func initTestDB() *gorm.DB {
	// Load env vars from .env (needed when running locally or in test)
	_ = godotenv.Load(".env")

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL") // Fallback if test URL not set
	}
	if dsn == "" {
		panic("TEST_DATABASE_URL and DATABASE_URL are both unset")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to test DB: " + err.Error())
	}

	// Auto-migrate schema
	if err := db.AutoMigrate(&Command{}, &TelemetryData{}); err != nil {
		panic("failed to auto-migrate test DB: " + err.Error())
	}

	return db
}

func setupTestServer() *echo.Echo {
	db = initTestDB() // Assign global db
	e := echo.New()
	e.GET("/", healthCheck)
	e.GET("/api/telemetry", getTelemetry)
	e.POST("/api/command", postCommand)
	return e
}

func TestHealthCheck(t *testing.T) {
	e := setupTestServer()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if assert.NoError(t, healthCheck(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "Mission Control Backend is running", rec.Body.String())
	}
}

func TestPostCommand_Valid(t *testing.T) {
	e := setupTestServer()

	body := map[string]interface{}{
		"name":   "REBOOT_SYSTEM",
		"code":   "123456",
		"status": "",
	}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/command", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)

	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if assert.NoError(t, postCommand(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)
	}
}

func TestPostCommand_InvalidHazardous(t *testing.T) {
	e := setupTestServer()

	body := map[string]interface{}{
		"name":      "DELETE_ALL",
		"code":      "123",
		"hazardous": true,
	}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/command", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)

	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := postCommand(c)
	if assert.NoError(t, err) {
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		var resp map[string]string
		_ = json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, "Hazardous commands require a 6-digit 2FA code", resp["error"])
	}
}
