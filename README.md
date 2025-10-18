# WorkLog - Personal Work Tracking System

A comprehensive work tracking application that helps you log your work sessions, manage tasks, and track your productivity with location-based automation.

## 🚀 Features

### Core Functionality
- **Location-Based Logging**: Automatically detect when you arrive/leave work locations
- **iPhone Automation**: Seamless integration with iOS Shortcuts for automated logging
- **Task Management**: Create, track, and manage your daily tasks
- **Event Journaling**: Log important events and milestones
- **Dashboard Analytics**: Visual insights into your work patterns and productivity
- **Data Export**: Export your data in CSV format with multiple options:
  - Individual exports: logs, places, tasks, events
  - Combined export: All data in a single CSV file with sections
  - Flexible filtering and formatting

### Technical Features
- **Real-time Geofencing**: Automatic place detection based on GPS coordinates
- **Duration Calculation**: Automatic calculation of work session durations
- **Multi-location Support**: Track work at multiple locations (office, home, etc.)
- **RESTful API**: Clean API design for easy integration
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between light and dark themes with system preference detection

## 🏗️ Architecture

### Backend (Python/Flask)
- **Framework**: Flask with CORS support
- **Database**: PostgreSQL with connection pooling
- **Authentication**: Environment-based configuration
- **API**: RESTful endpoints with JSON responses
- **Timezone**: UTC timestamps for global consistency

### Frontend (Next.js/React)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS for responsive design
- **Components**: Modular React components
- **Build**: Static site generation for optimal performance
- **Deployment**: Dockerized with Nginx serving
- **Theming**: Dark/Light mode with system preference detection

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Reverse Proxy**: Nginx for routing and load balancing
- **Database**: PostgreSQL with persistent volumes
- **Caching**: Redis for session management and caching

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worklog
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5051
   - Database: localhost:5432

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker Configuration

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js web application |
| Backend | 5051 | Flask API server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching and sessions |
| Nginx | 80 | Reverse proxy |

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:worklog_password@postgres:5432/worklog

# Backend
FLASK_ENV=production
PORT=5051

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5051
```

## 📊 API Documentation

### Core Endpoints

#### Logs
- `GET /api/logs` - Get all logs with optional filtering
- `POST /api/log` - Create a new log entry
- `DELETE /api/logs/{id}` - Delete a log entry

#### Places
- `GET /api/places` - Get all places
- `POST /api/places` - Add a new place
- `DELETE /api/places/{id}` - Delete a place

#### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event
- `PUT /api/events/{id}` - Update an event
- `DELETE /api/events/{id}` - Delete an event

#### Dashboard
- `GET /api/dashboard` - Get dashboard metrics and statistics

#### Export
- `GET /api/export?format=csv&type=logs` - Export logs as CSV
- `GET /api/export?format=csv&type=places` - Export places as CSV
- `GET /api/export?format=csv&type=tasks` - Export tasks as CSV
- `GET /api/export?format=csv&type=events` - Export events as CSV
- `GET /api/export?format=csv&type=combined` - Export all data in a single CSV file

### iPhone Automation Endpoints

For iOS Shortcuts integration:
- `GET /api/arrive/{lat}/{lon}` - Log arrival
- `GET /api/exit/{lat}/{lon}` - Log departure

## 🗄️ Database Schema

### Tables

#### `places`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `lat` (DOUBLE PRECISION NOT NULL)
- `lon` (DOUBLE PRECISION NOT NULL)
- `geofence_radius` (INTEGER)
- `type` (TEXT)

#### `logs`
- `id` (SERIAL PRIMARY KEY)
- `timestamp` (TIMESTAMPTZ NOT NULL)
- `event` (TEXT NOT NULL)
- `lat` (DOUBLE PRECISION NOT NULL)
- `lon` (DOUBLE PRECISION NOT NULL)
- `place_id` (TEXT REFERENCES places(id))
- `notes` (TEXT)
- `duration_minutes` (INTEGER)
- `mode` (TEXT)

#### `tasks`
- `id` (TEXT PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `status` (TEXT)
- `created_at` (TIMESTAMPTZ NOT NULL)
- `completed_at` (TIMESTAMPTZ)
- `priority` (TEXT)
- `due_by` (TIMESTAMPTZ)

#### `events`
- `id` (TEXT PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `date` (DATE NOT NULL)

## 🔧 Development

### Backend Development

```bash
cd backend
source venv/bin/activate
python app.py
```

**Key Files:**
- `app.py` - Main Flask application
- `schema.sql` - Database schema
- `requirements.txt` - Python dependencies

### Frontend Development

```bash
cd frontend
npm run dev
```

**Key Files:**
- `app/` - Next.js app directory
- `components/` - React components
- `package.json` - Node.js dependencies

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it worklog-postgres psql -U postgres -d worklog

# Run migrations
docker exec -it worklog-backend python -c "from app import init_database; init_database()"
```

## 📱 iPhone Integration

### Setting up iOS Shortcuts

1. **Create Arrival Shortcut:**
   ```
   Get Current Location
   Get Contents of URL: http://your-server.com/api/arrive/{Latitude}/{Longitude}
   ```

2. **Create Departure Shortcut:**
   ```
   Get Current Location
   Get Contents of URL: http://your-server.com/api/exit/{Latitude}/{Longitude}
   ```

3. **Automation Triggers:**
   - Set up location-based automations
   - Configure to run shortcuts when arriving/leaving locations

## 🚀 Deployment

### Production Deployment

1. **Update environment variables**
2. **Configure domain and SSL**
3. **Set up monitoring and logging**
4. **Configure backup strategies**

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ☁️ AWS Deployment

### Prerequisites
- AWS CLI configured
- Docker installed
- Domain name (optional)

### Option 1: AWS App Runner (Recommended for Simplicity)

#### 1. Prepare for App Runner
```bash
# Create ECR repository
aws ecr create-repository --repository-name worklog-backend
aws ecr create-repository --repository-name worklog-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. Build and Push Images
```bash
# Build backend image
cd backend
docker build -t worklog-backend .
docker tag worklog-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/worklog-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/worklog-backend:latest

# Build frontend image
cd ../frontend
docker build -t worklog-frontend .
docker tag worklog-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/worklog-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/worklog-frontend:latest
```

#### 3. Create RDS PostgreSQL Database
```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name worklog-subnet-group \
    --db-subnet-group-description "Subnet group for WorkLog database" \
    --subnet-ids subnet-12345 subnet-67890

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier worklog-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password YourSecurePassword123 \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-12345 \
    --db-subnet-group-name worklog-subnet-group
```

#### 4. Deploy with App Runner
Create `apprunner.yaml`:
```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building WorkLog Backend"
run:
  runtime-version: latest
  command: python app.py
  network:
    port: 5051
    env: PORT
  env:
    - name: DATABASE_URL
      value: postgresql://postgres:YourSecurePassword123@worklog-db.xyz.us-east-1.rds.amazonaws.com:5432/worklog
    - name: FLASK_ENV
      value: production
```

### Option 2: AWS ECS with Fargate

#### 1. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name worklog-cluster
```

#### 2. Create Task Definition
Create `task-definition.json`:
```json
{
  "family": "worklog-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/worklog-backend:latest",
      "portMappings": [
        {
          "containerPort": 5051,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://postgres:password@rds-endpoint:5432/worklog"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/worklog",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. Create ECS Service
```bash
aws ecs create-service \
    --cluster worklog-cluster \
    --service-name worklog-service \
    --task-definition worklog-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Option 3: AWS Elastic Beanstalk

#### 1. Create Application
```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
eb init worklog-app --platform python-3.11 --region us-east-1

# Create environment
eb create worklog-prod
```

#### 2. Configure Environment
Create `.ebextensions/database.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    DATABASE_URL: postgresql://postgres:password@rds-endpoint:5432/worklog
    FLASK_ENV: production
```

### Option 4: AWS EC2 with Docker

#### 1. Launch EC2 Instance
```bash
# Create key pair
aws ec2 create-key-pair --key-name worklog-key

# Launch instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.micro \
    --key-name worklog-key \
    --security-group-ids sg-12345
```

#### 2. Install Docker on EC2
```bash
# SSH into instance
ssh -i worklog-key.pem ec2-user@<instance-ip>

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd worklog

# Update docker-compose.yml with production settings
# Deploy
docker-compose up -d
```

### AWS Infrastructure Components

#### Required AWS Services
- **RDS PostgreSQL**: Database hosting
- **ECR**: Container image registry
- **ECS/App Runner**: Container orchestration
- **ALB**: Load balancing (if using ECS)
- **Route 53**: DNS management
- **CloudWatch**: Monitoring and logging
- **S3**: Static file storage (optional)

#### Security Groups Configuration
```bash
# Database security group
aws ec2 create-security-group \
    --group-name worklog-db-sg \
    --description "Security group for WorkLog database"

# Application security group
aws ec2 create-security-group \
    --group-name worklog-app-sg \
    --description "Security group for WorkLog application"

# Allow database access
aws ec2 authorize-security-group-ingress \
    --group-id sg-database \
    --protocol tcp \
    --port 5432 \
    --source-group sg-application
```

#### Environment Variables for AWS
```bash
# Database
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/worklog

# Application
FLASK_ENV=production
PORT=5051

# AWS specific
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Monitoring and Logging

#### CloudWatch Configuration
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/worklog

# Create log stream
aws logs create-log-stream \
    --log-group-name /ecs/worklog \
    --log-stream-name ecs/worklog-backend
```

#### CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name worklog-cpu-high \
    --alarm-description "CPU utilization is high" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold
```

### SSL/TLS Configuration

#### Using AWS Certificate Manager
```bash
# Request certificate
aws acm request-certificate \
    --domain-name your-domain.com \
    --validation-method DNS \
    --region us-east-1
```

#### ALB HTTPS Configuration
```yaml
# In ECS task definition
"loadBalancers": [
  {
    "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/worklog-tg/123",
    "containerName": "backend",
    "containerPort": 5051
  }
]
```

### Backup and Recovery

#### RDS Automated Backups
```bash
# Enable automated backups
aws rds modify-db-instance \
    --db-instance-identifier worklog-db \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00"
```

#### S3 Backup Script
```bash
#!/bin/bash
# Backup script for WorkLog data
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://worklog-backups/backup-$(date +%Y%m%d).sql.gz
```

### Cost Optimization

#### Reserved Instances
- Use RDS Reserved Instances for predictable workloads
- Consider Spot Instances for development environments
- Use S3 Intelligent Tiering for backup storage

#### Auto Scaling
```bash
# Create auto scaling group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name worklog-asg \
    --launch-template LaunchTemplateName=worklog-template \
    --min-size 1 \
    --max-size 5 \
    --desired-capacity 2
```

### Troubleshooting AWS Deployment

#### Common Issues
1. **Database Connection**: Check security groups and RDS endpoint
2. **Container Issues**: Check ECS task logs in CloudWatch
3. **Load Balancer**: Verify target group health checks
4. **DNS**: Ensure Route 53 records are properly configured

#### Useful Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster worklog-cluster --services worklog-service

# View CloudWatch logs
aws logs get-log-events --log-group-name /ecs/worklog --log-stream-name ecs/worklog-backend

# Check RDS status
aws rds describe-db-instances --db-instance-identifier worklog-db
```

## 📈 Monitoring and Health Checks

### Health Check Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /health`
- Database: Built-in PostgreSQL health checks

### Logging
- Application logs: Docker container logs
- Database logs: PostgreSQL logs
- Nginx logs: Access and error logs

## 🔒 Security

### Implemented Security Measures
- CORS configuration for API access
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Rate limiting via Nginx
- Security headers in responses
- Non-root Docker containers

### Recommended Additional Security
- SSL/TLS certificates
- Authentication and authorization
- API key management
- Database encryption at rest
- Regular security updates

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### API Testing

```bash
# Test health endpoint
curl http://localhost:5051/api/health

# Test log creation
curl -X POST http://localhost:5051/api/log \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "lat": 51.5074, "lon": -0.1278}'
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes using ports
   sudo lsof -ti:5051 | xargs kill -9
   sudo lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   ```

3. **Frontend build issues**
   ```bash
   # Clear node_modules and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

- Check the logs: `docker-compose logs [service-name]`
- Verify environment variables
- Ensure all services are healthy: `docker-compose ps`

## 🔮 Future Enhancements

- [ ] User authentication and multi-tenancy
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with calendar systems
- [ ] Team collaboration features
- [ ] Advanced geofencing with custom shapes
- [ ] Offline support and sync
- [ ] Advanced export formats (PDF, Excel)

---

**Built with ❤️ for productivity tracking**
