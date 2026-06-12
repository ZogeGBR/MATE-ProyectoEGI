# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema para ldap3
RUN apt-get update && apt-get install -y \
    libldap2-dev libsasl2-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de la app
COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]