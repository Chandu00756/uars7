#!/bin/bash

echo "🔍 ADCF Build Verification Script"
echo "================================"

# Check if main_clean.go exists
if [ -f "cmd/server/main_clean.go" ]; then
    echo "❌ Found problematic main_clean.go file - removing..."
    rm cmd/server/main_clean.go
else
    echo "✅ No main_clean.go file found"
fi

# Check if any other problematic files exist
echo ""
echo "🔍 Checking for duplicate main files:"
find . -name "*main*.go" -type f | while read file; do
    echo "   Found: $file"
done

# Try building
echo ""
echo "🔨 Testing build:"
if go build ./cmd/server; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Check for any .go files that might be cached by VS Code
echo ""
echo "🔍 All .go files in cmd/server:"
find cmd/server -name "*.go" -type f | while read file; do
    echo "   $file"
done

echo ""
echo "🎉 Verification complete! If VS Code still shows errors for main_clean.go,"
echo "   try restarting VS Code or running 'Go: Restart Language Server' command."
