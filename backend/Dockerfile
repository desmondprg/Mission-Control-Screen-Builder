FROM golang:1.23-alpine

# Install necessary packages including CGO build tools and nc for health checks
RUN apk add --no-cache \
  git \
  gcc \
  musl-dev \
  netcat-openbsd \
  postgresql-client

WORKDIR /app

# Copy project files
COPY . .

# Prepare Go dependencies and build binary
RUN go mod tidy && go build -o server .

# Copy and make entrypoint executable
COPY entrypoint.sh .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8080

# Entrypoint runs tests and starts server
CMD ["./entrypoint.sh"]
