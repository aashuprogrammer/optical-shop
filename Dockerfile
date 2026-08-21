# Multi-stage Dockerfile for OptiSuite Go Backend
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /optisuite-server main.go

# Production Runner Image
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /optisuite-server /app/optisuite-server
COPY --from=builder /app/db/migrations /app/db/migrations

EXPOSE 8080

CMD ["/app/optisuite-server"]
