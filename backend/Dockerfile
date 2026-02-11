FROM golang:1.23-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server .

FROM alpine:latest

COPY --from=build /app/server /server

EXPOSE 8080

CMD ["/server"]
