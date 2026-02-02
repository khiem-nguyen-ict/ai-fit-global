#!/usr/bin/env bash

npm run build

# -------------------------------
# FTP Deployment Script (Bash)
# -------------------------------

# 1. Define the path to your .env file
ENV_FILE=".env.production"

# 2. Check if the file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

# 3. Load, strip comments, and remove hidden \r (Carriage Returns)
# sed 's/\r$//' is the "magic" that fixes the 530 Login error
export $(grep -v '^#' "$ENV_FILE" | sed 's/\r$//' | xargs)

# 4. Optional: Verify variables are loaded (for your eyes only)
if [ -z "$FTP_PASS" ]; then
    echo "Error: FTP_PASS is empty. Check your .env file."
    exit 1
fi

echo "Environment loaded successfully for user: $FTP_USER"

# FTP credentials
echo "Deploying to host $FTP_HOST with FTP User: $FTP_USER"
# Remote directories
REMOTE_ASSETS_DIR="/assets"
REMOTE_ROOT_DIR="/"

# Local directories
LOCAL_ASSETS_DIR="./dist/assets"
LOCAL_ROOT_DIR="./dist"

# -------------------------------
# Step 1: Delete remote /assets contents
# -------------------------------
echo "Deleting remote assets..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:passive-mode on
set ssl:verify-certificate no
# -f suppresses the "File exists" error
# -p handles any parent directories if needed
mkdir -fp $REMOTE_ASSETS_DIR
cd $REMOTE_ASSETS_DIR
rm -f *
bye
EOF

# -------------------------------
# Step 2: Upload assets
# -------------------------------
echo "Uploading assets..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:passive-mode on
set ssl:verify-certificate no
mirror -R --only-newer --verbose $LOCAL_ASSETS_DIR $REMOTE_ASSETS_DIR
bye
EOF

# -------------------------------
# Step 3: Upload root files (exclude assets)
# -------------------------------
echo "Uploading root files..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:passive-mode on
set ssl:verify-certificate no
mirror -R --only-newer --exclude assets --verbose $LOCAL_ROOT_DIR $REMOTE_ROOT_DIR
bye
EOF

echo "All uploads completed."