package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile string
	version = "1.0.0"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "uars",
	Short: "UARS-7 Platform CLI",
	Long: `UARS-7 Platform Command Line Interface

A comprehensive CLI tool for managing and interacting with the 
Universal Adaptive Resilience System - Generation 7 platform.

This tool provides commands for:
- Service management and monitoring
- User and authentication management  
- Security policy configuration
- Governance operations
- Development and deployment tasks`,
	Version: version,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.uars.yaml)")
	rootCmd.PersistentFlags().String("endpoint", "https://api.uars7.com", "UARS-7 API endpoint")
	rootCmd.PersistentFlags().String("token", "", "Authentication token")
	rootCmd.PersistentFlags().Bool("debug", false, "Enable debug mode")

	// Bind flags to viper
	viper.BindPFlag("endpoint", rootCmd.PersistentFlags().Lookup("endpoint"))
	viper.BindPFlag("token", rootCmd.PersistentFlags().Lookup("token"))
	viper.BindPFlag("debug", rootCmd.PersistentFlags().Lookup("debug"))
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		viper.AddConfigPath(home)
		viper.AddConfigPath(".")
		viper.SetConfigType("yaml")
		viper.SetConfigName(".uars")
	}

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		if viper.GetBool("debug") {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}
}

func main() {
	Execute()
}
