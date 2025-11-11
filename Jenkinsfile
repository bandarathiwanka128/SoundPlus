/*pipeline {
    agent any

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
                echo "Current user: $(whoami)"
                echo "Current groups: $(id)"
                echo ""
                echo "Docker socket info:"
                sh 'ls -l /var/run/docker.sock || echo "Socket not found"'
                echo ""
                echo "Docker version:"
                sh 'docker --version || echo "Docker not available"'
                echo ""
                echo "Docker Compose version:"
                sh 'docker compose version || echo "Docker Compose not available"'
                echo ""
                echo "Test docker daemon access:"
                sh 'docker ps -q | head -3 || echo "Cannot access Docker daemon - check permissions"'
                echo ""
                echo "Workspace contents:"
                sh 'ls -la | head -20'
            }
        }

        stage('Setup Environment') {
            steps {
                echo 'Setting up environment files from .env.example if needed'
                // copy frontend .env if missing
                sh "if [ -f frontend/.env.example ]; then cd frontend && [ -f .env ] || cp .env.example .env; fi"
                // copy backend .env if missing
                sh "if [ -f backend/.env.example ]; then cd backend && [ -f .env ] || cp .env.example .env; fi"
            }
        }

        stage('Build & Test') {
            steps {
                sh 'docker-compose build'
                sh 'docker-compose up -d'
                sh 'sleep 30'  // Wait for containers to start
                sh 'docker-compose ps'  // Check container status
            }
        }

        stage('Deploy') {
            steps {
                sh 'echo "Deployment completed successfully"'
            }
        }
    }

    post {
        always {
            sh 'docker-compose down'  // Cleanup
        }
    }
}*/
pipeline {
    agent any

    environment {
        // Project settings
        COMPOSE_PROJECT_NAME = 'soundplus'
        PROJECT_NAME = 'SoundPlus++'
        
        // Docker Hub settings
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = 'thiwanka14535'
        BACKEND_IMAGE = "${DOCKER_USERNAME}/soundplus-backend"
        FRONTEND_IMAGE = "${DOCKER_USERNAME}/soundplus-frontend"
        
        // Git info
        GIT_COMMIT_SHORT = "${GIT_COMMIT.take(7)}"
        BUILD_TAG = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
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
                    echo "Current user: $(whoami)"
                    echo "Current groups: $(id)"
                    echo ""
                    
                    echo "Docker version:"
                    docker --version
                    echo ""
                    
                    echo "Docker Compose version:"
                    docker compose version || docker-compose --version
                    echo ""
                    
                    echo "Current containers:"
                    docker ps -a
                    echo ""
                    
                    echo "Cleaning up any existing containers..."
                    docker rm -f soundplus-backend soundplus-frontend 2>/dev/null || true
                    docker network rm soundplus-ci-cd_soundplus-network 2>/dev/null || true
                    echo "Cleanup complete"
                '''
            }
        }

        stage('Setup Environment') {
            steps {
                echo 'Setting up environment files from .env.example if needed'
                sh '''
                    # Frontend environment
                    if [ -f frontend/.env.example ]; then
                        if [ ! -f frontend/.env ]; then
                            cp frontend/.env.example frontend/.env
                            echo "✓ Created frontend/.env"
                        else
                            echo "✓ frontend/.env already exists"
                        fi
                    fi
                    
                    # Backend environment
                    if [ -f backend/.env.example ]; then
                        if [ ! -f backend/.env ]; then
                            cp backend/.env.example backend/.env
                            echo "✓ Created backend/.env"
                        else
                            echo "✓ backend/.env already exists"
                        fi
                        
                        # Show backend env (without secrets)
                        echo ""
                        echo "Backend environment variables:"
                        grep -v -E '(PASSWORD|SECRET|KEY)' backend/.env || true
                    fi
                '''
            }
        }

        stage('Build Images') {
            steps {
                echo '=== Building Docker Images ==='
                sh '''
                    # Determine which compose file to use
                    if [ "$GIT_BRANCH" = "origin/main" ] || [ "$GIT_BRANCH" = "main" ]; then
                        COMPOSE_FILE="docker-compose.yml"
                        ENV_LABEL="production"
                    else
                        COMPOSE_FILE="docker-compose.dev.yml"
                        ENV_LABEL="development"
                    fi
                    
                    echo "Using compose file: $COMPOSE_FILE (Environment: $ENV_LABEL)"
                    
                    # Build with proper file
                    docker-compose -f $COMPOSE_FILE down -v || true
                    docker-compose -f $COMPOSE_FILE build --no-cache
                    
                    echo "✓ Docker images built successfully"
                '''
            }
        }

        stage('Start Services') {
            steps {
                echo '=== Starting Services ==='
                sh 'docker-compose up -d'
                
                script {
                    echo 'Waiting for services to be healthy...'
                    
                    // Wait for backend health check
                    def backendHealthy = false
                    def maxRetries = 20
                    def retryCount = 0
                    
                    while (retryCount < maxRetries && !backendHealthy) {
                        sleep(5)
                        
                        def backendStatus = sh(
                            script: 'docker inspect soundplus-backend --format="{{.State.Health.Status}}" 2>/dev/null || echo "not-found"',
                            returnStdout: true
                        ).trim()
                        
                        echo "Backend health status (attempt ${retryCount + 1}/${maxRetries}): ${backendStatus}"
                        
                        if (backendStatus == 'healthy') {
                            backendHealthy = true
                            echo '✓ Backend is healthy'
                        } else if (backendStatus == 'unhealthy') {
                            echo '✗ Backend is unhealthy. Checking logs...'
                            sh 'docker-compose logs --tail=50 backend'
                            error('Backend container failed health check')
                        } else if (backendStatus == 'not-found') {
                            echo '✗ Backend container not found'
                            sh 'docker ps -a'
                            error('Backend container does not exist')
                        }
                        
                        retryCount++
                    }
                    
                    if (!backendHealthy) {
                        echo '✗ Backend failed to become healthy within timeout'
                        sh 'docker-compose logs backend'
                        sh 'docker-compose ps'
                        error('Backend did not become healthy within 100 seconds')
                    }
                    
                    // Wait for frontend health check
                    def frontendHealthy = false
                    retryCount = 0
                    
                    while (retryCount < maxRetries && !frontendHealthy) {
                        sleep(5)
                        
                        def frontendStatus = sh(
                            script: 'docker inspect soundplus-frontend --format="{{.State.Health.Status}}" 2>/dev/null || echo "not-found"',
                            returnStdout: true
                        ).trim()
                        
                        echo "Frontend health status (attempt ${retryCount + 1}/${maxRetries}): ${frontendStatus}"
                        
                        if (frontendStatus == 'healthy') {
                            frontendHealthy = true
                            echo '✓ Frontend is healthy'
                        } else if (frontendStatus == 'unhealthy') {
                            echo '✗ Frontend is unhealthy. Checking logs...'
                            sh 'docker-compose logs --tail=50 frontend'
                            error('Frontend container failed health check')
                        }
                        
                        retryCount++
                    }
                    
                    if (!frontendHealthy) {
                        echo '✗ Frontend failed to become healthy within timeout'
                        sh 'docker-compose logs frontend'
                        sh 'docker-compose ps'
                        error('Frontend did not become healthy within 100 seconds')
                    }
                }
            }
        }

        stage('Verify Services') {
            steps {
                echo '=== Verifying Services ==='
                sh '''
                    echo "Container status:"
                    docker-compose ps
                    echo ""
                    
                    echo "Backend logs (last 20 lines):"
                    docker-compose logs --tail=20 backend
                    echo ""
                    
                    echo "Frontend logs (last 20 lines):"
                    docker-compose logs --tail=20 frontend
                    echo ""
                    
                    echo "Network connectivity:"
                    docker exec soundplus-backend curl -f http://localhost:5000/health || echo "Backend health endpoint failed"
                    docker exec soundplus-frontend curl -f http://localhost:3000 || echo "Frontend health check failed"
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '=== Running Tests ==='
                sh '''
                    # Add your test commands here
                    # Example:
                    # docker-compose exec -T backend npm test
                    # docker-compose exec -T frontend npm test
                    
                    echo "Tests would run here"
                '''
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                echo '=== Pushing Images to Docker Hub ==='
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        try {
                            sh '''
                                echo "Logging in to Docker Hub..."
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                
                                echo ""
                                echo "Tagging and pushing backend image..."
                                docker tag soundplus-backend:latest $DOCKER_USER/soundplus-backend:latest
                                docker tag soundplus-backend:latest $DOCKER_USER/soundplus-backend:${BUILD_TAG}
                                docker push $DOCKER_USER/soundplus-backend:latest
                                docker push $DOCKER_USER/soundplus-backend:${BUILD_TAG}
                                echo "✓ Backend image pushed successfully"
                                
                                echo ""
                                echo "Tagging and pushing frontend image..."
                                docker tag soundplus-frontend:latest $DOCKER_USER/soundplus-frontend:latest
                                docker tag soundplus-frontend:latest $DOCKER_USER/soundplus-frontend:${BUILD_TAG}
                                docker push $DOCKER_USER/soundplus-frontend:latest
                                docker push $DOCKER_USER/soundplus-frontend:${BUILD_TAG}
                                echo "✓ Frontend image pushed successfully"
                                
                                echo ""
                                echo "Logging out from Docker Hub..."
                                docker logout
                                echo "✓ Push to Docker Hub completed"
                            '''
                        } catch (Exception e) {
                            echo "⚠ Warning: Docker Hub push failed - ${e.message}"
                            echo "Pipeline will continue, but images were not pushed"
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Deployment Stage ==='
                sh '''
                    echo "✓ All services are running and healthy"
                    echo "✓ Backend: http://localhost:5000"
                    echo "✓ Frontend: http://localhost:3000"
                    echo ""
                    echo "Deployment completed successfully!"
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo '✓ Pipeline completed successfully!'
        }
        failure {
            echo '✗ Pipeline failed. Check logs above for details.'
        }
    }
}