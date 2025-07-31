#!/bin/sh

echo "⏳ Waiting for PostgreSQL to be ready..."

until nc -z db 5432; do
  sleep 1
done

echo "✅ PostgreSQL is up. Running backend tests..."
go test -v ./...

echo "🚀 Starting backend server..."
./server
