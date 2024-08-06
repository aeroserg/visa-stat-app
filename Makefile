.PHONY: up down build run

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down -v

run:
	docker-compose up -d --build