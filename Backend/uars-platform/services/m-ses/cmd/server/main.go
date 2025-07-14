package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"google.golang.org/grpc"

	"github.com/portalvii/uars7/services/m-ses/internal/enforcement"
	"github.com/portalvii/uars7/services/m-ses/internal/security"
)

func main() {
	// Initialize configuration
	initConfig()

	// Initialize logger
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	// Initialize services
	securityService := security.NewService(logger)
	enforcementService := enforcement.NewService(logger)

	// Start gRPC server
	grpcServer := grpc.NewServer()

	// Register services here when proto files are generated

	// Start gRPC server in goroutine
	go func() {
		lis, err := net.Listen("tcp", ":50052")
		if err != nil {
			log.Fatalf("Failed to listen: %v", err)
		}
		logger.Info("M-SES gRPC server starting on :50052")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Start HTTP server
	go func() {
		r := gin.Default()

		// Health check endpoint
		r.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"service":   "m-ses",
				"timestamp": time.Now().Unix(),
			})
		})

		// Security enforcement endpoints
		r.POST("/api/security/validate", func(c *gin.Context) {
			var req map[string]interface{}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			result := securityService.ValidateRequest(context.Background(), req)
			c.JSON(http.StatusOK, result)
		})

		r.POST("/api/security/enforce", func(c *gin.Context) {
			var req map[string]interface{}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			result := enforcementService.EnforcePolicy(context.Background(), req)
			c.JSON(http.StatusOK, result)
		})

		logger.Info("M-SES HTTP server starting on :8081")
		if err := r.Run(":8081"); err != nil {
			log.Fatalf("Failed to run HTTP server: %v", err)
		}
	}()

	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	logger.Info("Shutting down M-SES service...")
	grpcServer.GracefulStop()
}

func initConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/m-ses")

	// Set defaults
	viper.SetDefault("grpc.port", "50052")
	viper.SetDefault("http.port", "8081")
	viper.SetDefault("security.mode", "strict")
	viper.SetDefault("enforcement.enabled", true)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("Config file not found, using defaults")
		} else {
			log.Fatalf("Error reading config file: %v", err)
		}
	}

	viper.AutomaticEnv()
}
