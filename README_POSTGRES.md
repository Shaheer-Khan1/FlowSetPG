# PostgreSQL Docker Setup

This project uses PostgreSQL running in a Docker container.

## Quick Start

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

### 2. Check Status
```bash
docker-compose ps
docker-compose logs postgres
```

### 3. Stop PostgreSQL
```bash
docker-compose down
```

### 4. Stop and Remove Data (⚠️ Deletes all data)
```bash
docker-compose down -v
```

## Configuration

### Database Credentials
- **Host:** localhost
- **Port:** 5432
- **Database:** flowset_db
- **User:** flowset_user
- **Password:** flowset_password

See `.env.postgres` for the complete configuration.

### Connection String
```
postgresql://flowset_user:flowset_password@localhost:5432/flowset_db
```

## Connecting to PostgreSQL

### Using psql (from host)
```bash
docker exec -it flowset-postgres psql -U flowset_user -d flowset_db
```

### Using psql (interactive shell)
```bash
docker-compose exec postgres psql -U flowset_user -d flowset_db
```

### Common psql Commands
- `\l` - List all databases
- `\dt` - List all tables
- `\d table_name` - Describe a table
- `\q` - Quit psql

## Database Initialization

The `init-db/01-init.sql` script runs automatically when the container starts for the first time. Add your table definitions and initial data there.

## Backup and Restore

### Create Backup
```bash
docker exec flowset-postgres pg_dump -U flowset_user flowset_db > backup.sql
```

### Restore Backup
```bash
docker exec -i flowset-postgres psql -U flowset_user -d flowset_db < backup.sql
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs postgres

# Remove old container and volumes
docker-compose down -v
docker-compose up -d
```

### Connection refused
Make sure the container is running and healthy:
```bash
docker-compose ps
docker-compose logs postgres
```

### Reset everything
```bash
docker-compose down -v
docker volume rm flowsetpg_postgres_data
docker-compose up -d
```

## Using with Node.js

### Install pg package
```bash
cd backend
npm install pg
```

### Example Connection
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'flowset_db',
  user: process.env.POSTGRES_USER || 'flowset_user',
  password: process.env.POSTGRES_PASSWORD || 'flowset_password',
});

// Test connection
const client = await pool.connect();
const result = await client.query('SELECT NOW()');
console.log('Connected to PostgreSQL:', result.rows[0]);
client.release();
```
