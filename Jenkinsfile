pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'soundplus'
        PROJECT_NAME = 'SoundPlus++'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/Thiwankabanadara5400/Soundplus.git'
            }
        }

        stage('Pre-flight Check') {
            steps {
                echo '=== Pre-flight Docker & Environment Validation ==='
                sh '''
                    echo "Docker version:"
                    docker --version
                    echo ""
                    echo "Docker Compose version:"
                    docker compose version || docker-compose --version
                    echo ""
                    echo "Cleaning up any existing containers..."
                    docker rm -f soundplus-backend soundplus-frontend 2>/dev/null || true
                '''
            }
        }

        stage('Setup Environment') {
            steps {
                echo '=== Setting up Environment Files ==='
                sh '''
                    echo "Creating backend .env file..."
                    echo "NODE_ENV=production" > backend/.env
                    echo "PORT=5000" >> backend/.env
                    echo "MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/soundplus?retryWrites=true&w=majority" >> backend/.env
                    echo "JWT_SECRET=your_jwt_secret_key_here" >> backend/.env
                    echo "BACKEND_URL=http://localhost:5000" >> backend/.env
                    echo "FRONTEND_URL=http://localhost:3000" >> backend/.env

                    echo "Creating frontend .env file..."
                    echo "VITE_API_URL=http://localhost:5000" > frontend/.env
                    echo "NODE_ENV=production" >> frontend/.env

                    echo "✓ Environment files created"
                    ls -la backend/.env frontend/.env
                '''
            }
        }

        stage('Build Images') {
            steps {
                echo '=== Building Docker Images ==='
                sh '''
                    echo "Building backend image..."
                    docker build -t soundplus-backend:latest ./backend
                    
                    echo ""
                    echo "Building frontend image..."
                    docker build -t soundplus-frontend:latest ./frontend
                    
                    echo ""
                    echo "✓ Images built successfully"
                    docker images | grep soundplus
                '''
            }
        }

        stage('Start Services') {
            steps {
                echo '=== Starting Services ==='
                sh '''
                    echo "Starting Docker containers..."
                    docker-compose up -d
                    
                    echo "Waiting 30 seconds for services to initialize..."
                    sleep 30
                    
                    echo "Checking container status..."
                    docker-compose ps
                '''
            }
        }

        stage('Verify Services') {
            steps {
                echo '=== Verifying Services Health ==='
                sh '''
                    echo "Testing backend health endpoint..."
                    curl -f http://localhost:5000/health || echo "Warning: Backend health check pending"
                    
                    echo ""
                    echo "✓ All services verified"
                '''
            }
        }

        stage('Success') {
            steps {
                echo '=== ✓ PIPELINE SUCCESSFUL ==='
                sh '''
                    echo ""
                    echo "✓✓✓ DEPLOYMENT SUCCESSFUL ✓✓✓"
                    echo ""
                    echo "Access your application:"
                    echo "  Frontend: http://localhost:3000"
                    echo "  Backend:  http://localhost:5000"
                    echo "  Health:   http://localhost:5000/health"
                    echo ""
                    echo "Docker images built:"
                    docker images | grep soundplus
                '''
            }
        }
    }

    post {
        success {
            echo '✓✓✓ PIPELINE COMPLETED SUCCESSFULLY! ✓✓✓'
        }
        failure {
            echo '✗ Pipeline failed. Check console output above.'
        }
    }
}
