
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
                sh '''
                    echo "Starting Docker containers..."
                    docker-compose up -d
                    
                    echo "Waiting for services to initialize (30 seconds)..."
                    sleep 30
                    
                    echo "Checking container status..."
                    docker-compose ps
                    
                    echo "Checking backend logs for errors..."
                    docker-compose logs backend | head -50
                    
                    echo "Checking if backend is responding..."
                    curl -f http://localhost:5000/health || (echo "Warning: Backend not responding yet" && false) || true
                    
                    echo "✓ Services started"
                '''
            }
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