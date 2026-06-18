# EGI — Inventario ITU — Guía de arranque rápido

## Requisitos previos
- Ubuntu 22.04 (WSL o VM)
- Docker instalado y corriendo
- Minikube instalado
- kubectl instalado

## Pasos para levantar el proyecto

### 1. Clonar el repo y entrar a la carpeta
```bash
cd ~/EGI
git checkout frontend-prueba   # o la rama que corresponda
```

### 2. Levantar Minikube con Calico
```bash
minikube start --driver=docker --cni=calico --memory=4096 --cpus=2
```

### 3. Apuntar Docker al daemon de Minikube y buildear la imagen
```bash
eval $(minikube docker-env)
docker build -t inventario-app:latest .
```

### 4. Crear el namespace y aplicar los manifiestos
```bash
kubectl create namespace inventario-egi

# Secrets (crear manualmente — NO están en el repo por seguridad)
kubectl create secret generic app-secret \
  --from-literal=MYSQL_PASSWORD=AppPass2024! \
  --from-literal=MONGO_PASSWORD=MongoPass2024! \
  --from-literal=LDAP_BIND_PASSWORD=LdapAdmin2024! \
  --from-literal=JWT_SECRET_KEY=JwtSuperSecretEGI2024!! \
  -n inventario-egi

kubectl create secret generic mysql-secret \
  --from-literal=MYSQL_ROOT_PASSWORD=RootPass2024! \
  --from-literal=MYSQL_USER=app_user \
  --from-literal=MYSQL_PASSWORD=AppPass2024! \
  -n inventario-egi

# Aplicar el resto de manifiestos
kubectl apply -f k8s/mysql-secret.yaml
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/mysql-service.yaml
kubectl apply -f k8s/app-deployment.yaml
```

### 5. Verificar pods
```bash
kubectl get pods -n inventario-egi
```
Esperado: `mysql-xxx` y `app-deployment-xxx` en estado `Running`.

### 6. Acceder a la app
```bash
minikube service inventario-app-service -n inventario-egi --url
```
Abrí esa URL en el navegador → pantalla de login.

## Próxima vez (si ya está desplegado)
```bash
minikube start --driver=docker --cni=calico
kubectl get pods -n inventario-egi
minikube service inventario-app-service -n inventario-egi --url
```

## Notas importantes
- El login requiere OpenLDAP desplegado (Integrante 4)
- El detalle de equipo requiere MongoDB desplegado (Integrante 3/4)
- El inventario (tabla) solo requiere MySQL ✅
