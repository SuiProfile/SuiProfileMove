#!/bin/bash

# Walrus CLI Installation Script for Linux/macOS

echo "Installing Walrus CLI..." 

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DOWNLOAD_URL="https://github.com/MystenLabs/walrus/releases/latest/download/walrus-linux-x86_64"
    BINARY_NAME="walrus"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    DOWNLOAD_URL="https://github.com/MystenLabs/walrus/releases/latest/download/walrus-macos-x86_64"
    BINARY_NAME="walrus"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

# Create walrus directory
mkdir -p ./walrus

# Download Walrus CLI
echo "Downloading Walrus CLI from: $DOWNLOAD_URL"
curl -L "$DOWNLOAD_URL" -o "./walrus/$BINARY_NAME"

# Make executable
chmod +x "./walrus/$BINARY_NAME"

# Test installation
echo "Testing Walrus CLI installation..."
if "./walrus/$BINARY_NAME" --version; then
    echo "Walrus CLI installed successfully!"
else
    echo "Installation test failed"
    exit 1
fi

# Initialize Walrus
echo "Initializing Walrus..."
if "./walrus/$BINARY_NAME" init; then
    echo "Walrus initialized!"
else
    echo "Walrus initialization failed"
fi

echo "Installation completed! You can now use Walrus CLI."
echo "Usage: ./walrus/$BINARY_NAME <command>"
