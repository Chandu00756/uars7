#!/bin/bash

# Build script for UARS Policy Engine WASM module
# This script builds the Rust code into WebAssembly

set -e

echo "Building UARS Policy Engine WASM module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust/Cargo is not installed. Please install Rust first."
    echo "Visit: https://rustup.rs/"
    exit 1
fi

# Create pkg directory if it doesn't exist
mkdir -p pkg

# Build the WASM module
echo "Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir pkg --release

# Verify the build
if [ -f "pkg/uars_policy_engine.wasm" ]; then
    echo "✅ WASM module built successfully!"
    echo "📦 Output files:"
    ls -la pkg/
    echo ""
    echo "📊 WASM file size:"
    du -h pkg/uars_policy_engine.wasm
else
    echo "❌ Build failed! WASM file not found."
    exit 1
fi

# Optional: Run tests if they exist
if [ -f "tests/web.rs" ]; then
    echo "🧪 Running WASM tests..."
    wasm-pack test --chrome --headless
fi

echo "🎉 Build complete!"
echo ""
echo "To use the WASM module in Go:"
echo "1. Copy pkg/uars_policy_engine.wasm to your assets directory"
echo "2. Use the Go WASM runtime to load and execute the module"
echo "3. Call the exported functions from your Go code"
