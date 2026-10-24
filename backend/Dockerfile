# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Application with Maven Wrapper & JDK 25
# ==============================================================================
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /build

# Copy Maven wrapper configuration and POM first for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure the Maven wrapper script has execution permissions
RUN chmod +x mvnw

# Pre-fetch project dependencies to leverage Docker layer caching
RUN ./mvnw dependency:go-offline -B || true

# Copy backend source code
COPY src ./src

# Build production executable fat JAR (skipping unit tests during image build)
RUN ./mvnw clean package -DskipTests -B

# ==============================================================================
# Stage 2: Production Runtime with Lightweight JRE 25 & Non-Root Security
# ==============================================================================
FROM eclipse-temurin:25-jre AS runner

WORKDIR /app

# Create unprivileged system user and group for non-root execution
RUN addgroup --system prota && adduser --system --ingroup prota prota

# Prepare uploads directory with correct non-root permissions
RUN mkdir -p /app/uploads/avatars && chown -R prota:prota /app

# Copy the built Spring Boot executable JAR from the builder stage
COPY --from=builder --chown=prota:prota /build/target/prota-0.0.1-SNAPSHOT.jar app.jar

# Enforce non-root execution
USER prota:prota

# Default environment configuration (Render overrides PORT dynamically at runtime)
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

# Production JVM flags:
# - UseContainerSupport: Automatically honors container cgroup memory and CPU limits
# - MaxRAMPercentage=75.0: Allocates up to 75% of container RAM to the JVM heap
# - Dserver.port: Binds dynamically to Render's assigned $PORT
ENTRYPOINT ["sh", "-c", "exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
