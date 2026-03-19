#!/bin/bash

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building app..."
npm run build

echo "Restarting PM2..."
pm2 restart wdc-frontend

echo "Deployment complete."
