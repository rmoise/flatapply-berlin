# n8n Docker Setup Guide

## 🚀 Quick Start (One Command!)

```bash
# Run this in your flatapply-berlin directory:
./n8n-setup.sh
```

That's it! The script will:
- Create directories
- Set up Docker containers
- Copy your workflow
- Start n8n

## 🔧 Manual Setup

### 1. Start Basic n8n
```bash
# Simple version (SQLite database)
docker-compose up -d n8n

# With PostgreSQL (more reliable)
docker-compose up -d n8n-postgres n8n

# With Puppeteer support (for full scraping)
docker-compose up -d n8n-puppeteer
```

### 2. Access n8n
- URL: http://localhost:5678
- Username: `admin`
- Password: `flatapply2024`

### 3. Import Workflow
1. Click "Add workflow"
2. Menu (⋮) → "Import from File"
3. Select the workflow JSON

## 📊 Docker Compose Options

### Basic n8n (Default)
- Port: 5678
- Database: SQLite
- Good for: Testing, small scale

### n8n with PostgreSQL
```bash
# Start both services
docker-compose up -d n8n-postgres n8n

# Update n8n environment in docker-compose.yml
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=n8n-postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=n8n_pass_2024
```

### n8n with Puppeteer
```bash
# Build and run
docker-compose up -d --build n8n-puppeteer

# Access on port 5679
http://localhost:5679
```

## 🛠️ Common Commands

### View Logs
```bash
# All logs
docker-compose logs -f

# Just n8n
docker-compose logs -f n8n

# Last 100 lines
docker-compose logs --tail=100 n8n
```

### Restart Services
```bash
# Restart n8n
docker-compose restart n8n

# Stop everything
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Backup Data
```bash
# Backup n8n data
docker run --rm -v flatapply-berlin_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .

# Restore
docker run --rm -v flatapply-berlin_n8n_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n-backup.tar.gz -C /data
```

## 🔌 Connecting to Your App

### Option 1: Direct Database
In n8n Supabase nodes:
- Host: `host.docker.internal` (Mac/Windows)
- Host: `172.17.0.1` (Linux)
- Database: Your Supabase database
- Port: 5432

### Option 2: Via API
Create an API endpoint in your Next.js app:
```typescript
// app/api/n8n/listings/route.ts
export async function POST(request: Request) {
  const listings = await request.json();
  // Save to Supabase
  return Response.json({ success: true });
}
```

Then in n8n use HTTP Request node to your API.

## 🎯 Recommended Setup

For production use:
```bash
# 1. Use PostgreSQL version
docker-compose up -d n8n-postgres n8n

# 2. Set up reverse proxy (optional)
# Add to docker-compose.yml:
caddy:
  image: caddy:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
  networks:
    - n8n-network
```

## 🐛 Troubleshooting

### n8n won't start
```bash
# Check logs
docker-compose logs n8n

# Check if port is in use
lsof -i :5678

# Try different port
# Edit docker-compose.yml: "5679:5678"
```

### Can't connect to Supabase
```bash
# Test from container
docker exec -it n8n ping supabase.com

# Use public URL instead of localhost
```

### Workflow errors
- Check execution logs in n8n UI
- Enable "Save Manual Executions" in settings
- Test each node individually

## 🚨 Security Notes

1. **Change default password** in production
2. **Use HTTPS** with reverse proxy
3. **Limit IP access** if possible
4. **Regular backups** of n8n data

## 📈 Scaling

When you need more:
1. **Multiple workers**: Set `EXECUTIONS_PROCESS=queue`
2. **Redis queue**: Add Redis service
3. **Horizontal scaling**: Use Kubernetes

Happy scraping! 🎉