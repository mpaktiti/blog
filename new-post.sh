#!/bin/bash

# Script to create a new blog post structure
# Usage: ./new-post.sh "Blog Post Title"

if [ -z "$1" ]; then
    echo "Error: Please provide a blog post title"
    echo "Usage: ./new-post.sh \"Blog Post Title\""
    exit 1
fi

# Convert title to kebab-case (e.g., "Books of 2024" -> "books-of-2024")
SLUG=$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')

# Get current date in YYYY-MM-DD format
CURRENT_DATE=$(date +%Y-%m-%d)

# Define paths
BLOG_DIR="/Users/maria/Documents/blog"
POST_DIR="$BLOG_DIR/content/blog/$SLUG"
INDEX_FILE="$POST_DIR/index.md"

# Navigate to blog directory
cd "$BLOG_DIR" || exit 1

# Create new git branch
echo "Creating git branch: $SLUG"
git checkout -b "$SLUG"

# Create post directory
echo "Creating directory: $POST_DIR"
mkdir -p "$POST_DIR"

# Create index.md with frontmatter
echo "Creating index.md"
cat > "$INDEX_FILE" << EOF
---
title: $1
date: "$CURRENT_DATE"
description: ""
---
EOF

echo "Blog post structure created successfully!"
echo "Branch: $SLUG"
echo "Location: $POST_DIR"

# Try to open with VS Code first, fall back to Sublime Text
if command -v code &> /dev/null; then
    echo "Opening with Visual Studio Code..."
    code "$INDEX_FILE"
elif command -v subl &> /dev/null; then
    echo "Opening with Sublime Text..."
    subl "$INDEX_FILE"
else
    echo "Neither VS Code nor Sublime Text found in PATH"
    echo "You can manually open: $INDEX_FILE"
fi
