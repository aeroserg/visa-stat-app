.PHONY: up down run backup-db

DB_FILE=server/src/visa_stats.db
XLSX_FILE=server/src/stats_visa.xlsx
CONTAINER_NAME=visa-stat-app-backend
CONTAINER_DB_PATH=/app/dist/visa_stats.db
CONTAINER_XLSX_PATH=/app/dist/stats_visa.xlsx
HOST_DB_PATH=./server/src/visa_stats.db
HOST_XLSX_PATH=./server/src/stats_visa.xlsx

down:
	docker cp $(CONTAINER_NAME):$(CONTAINER_DB_PATH) $(HOST_DB_PATH)
	docker cp $(CONTAINER_NAME):$(CONTAINER_XLSX_PATH) $(HOST_XLSX_PATH)
	docker-compose down -v

run: 
	docker-compose up -d --build

backup-db:
	docker cp $(CONTAINER_NAME):$(CONTAINER_DB_PATH) $(HOST_DB_PATH)
	docker cp $(CONTAINER_NAME):$(CONTAINER_XLSX_PATH) $(HOST_XLSX_PATH)

clean:
	docker-compose down -v
	rm -f $(HOST_DB_PATH)
	rm -f $(HOST_XLSX_PATH)
