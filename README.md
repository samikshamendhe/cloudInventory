# CloudInventory

CloudInventory is a containerized inventory and order-management demo. The backend is implemented in **Python (FastAPI)**; the existing **React/JavaScript** frontend is retained.

## Stack

- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy with SQLite persistence
- JWT authentication; administrator-only write endpoints
- React, JavaScript, CSS, Axios (existing frontend)
- Docker, Docker Compose, AWS EC2

## Features

- Public read-only dashboard, product, inventory, and order views
- Environment-configured administrator and viewer accounts
- Bearer JWT authentication; write endpoints require the ADMIN role
- Product create/update/delete and stock tracking
- Order creation calculates total amount, validates available stock, and reduces stock
- Order status updates
- SQLite persistence under `/data/cloudinventory.sqlite3` using the existing `cloudinventory-data` Docker volume
- Existing frontend-compatible camelCase response keys (`customerName`, `productId`)

## Local run

Run Docker Compose from the repository root. Keep `.env` private; it should contain `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `VIEWER_USERNAME`, `VIEWER_PASSWORD`, and a strong Base64-encoded `JWT_SECRET`.

```bash
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

The local Compose port remains whatever the repository currently configures (normally `http://localhost:3000`). Health check: `GET /api/health`. For standalone development outside Docker, install `backend/requirements.txt` and set `DATABASE_URL=sqlite:///./cloudinventory.db` before running `uvicorn app.main:app --reload --port 8082` from `backend/`.

## Important: migrate existing AWS data before switching backends

Spring Boot's H2 files are not the same format as SQLite. The Python backend uses a separate file `/data/cloudinventory.sqlite3` in the **same named Docker volume**, so the old H2 files are left untouched. Export the current data first and import it into SQLite before recreating the backend container.

### Migration on EC2 (follow in this order)

1. **Keep the Java backend running.** After the Python code is pushed and pulled on EC2, export current data from the existing public API:
   ```bash
   bash migration-tools/export-current-aws-data.sh http://localhost
   ```
   The script prints a private directory such as `/home/ec2-user/cloudinventory-migration-20261023-210000`. Note that exact path. The files contain demo order/customer details; do not commit or publish them.

2. Build the Python image while the existing Java backend is still running:
   ```bash
   docker compose build backend
   ```

3. Import the saved data to SQLite **before recreating the service**. Replace `BACKUP_DIR` with the exact path printed in Step 1:
   ```bash
   BACKUP_DIR="$HOME/cloudinventory-migration-YYYYMMDD-HHMMSS"
   docker compose run --rm --no-deps \\
     -v "$BACKUP_DIR/products.json:/tmp/products.json:ro" \\
     -v "$BACKUP_DIR/orders.json:/tmp/orders.json:ro" \\
     backend python -m app.import_legacy /tmp/products.json /tmp/orders.json
   ```
   Confirm it reports the expected counts (currently 5 products and 6 orders). The importer refuses to add data if the new SQLite database already has rows.

4. Only if import succeeded, replace the backend container:
   ```bash
   docker compose up -d --force-recreate backend
   ```
   This does not recreate the frontend. The frontend continues proxying `/api` to the same Compose service name and port.

5. Verify the backend before considering the migration complete:
   ```bash
   curl -fsS http://localhost/api/health
   curl -fsS http://localhost/api/products
   curl -fsS http://localhost/api/orders
   docker compose logs --tail=80 backend
   ```
   Then use the website to confirm admin login, product edits, stock adjustments, order creation, and order-status updates.

6. Keep the JSON backup and the previous Git commit until all checks pass. **Never run `docker compose down -v`**; it deletes the persistent Docker volume. If something fails, stop and inspect logs rather than deleting any volume or database files.

## API endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/products`, `GET /api/products/{id}`
- `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` (ADMIN)
- `GET /api/inventory`
- `GET /api/orders`, `GET /api/orders/{id}`
- `POST /api/orders`, `PUT /api/orders/{id}/status` (ADMIN)

## Security note

This portfolio demo uses environment-based accounts. Use HTTPS and stronger account management before handling real customer data or real credentials. The current live demo uses HTTP by user choice.
