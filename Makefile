.PHONY: up down build run

build:
	docker compose build

up:
	docker compose up -d

down:
	npm i
	cd server
	npm i
	cd ..
	npm run backup 
	docker compose down -v

run:
	docker compose up -d --build