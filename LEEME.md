# EGI — Ecosistema de Inventario Seguro
### ITU UNCUYO — Proyecto Integrador

---

## Requisitos previos

- Ubuntu 22.04 (WSL2 o VM)
- Docker instalado y corriendo
- Minikube instalado
- kubectl instalado

---

## Levantar el proyecto (primer vez)

### 1. Clonar el repo
git clone https://github.com/ZogeGBR/MATE-ProyectoEGI.git

cd MATE-ProyectoEGI

git checkout EGI-Final
### 2. Iniciar Minikube con Calico
minikube start --driver=docker --cni=calico --memory=4096 --cpus=2
### 3. Buildear la imagen
eval $(minikube docker-env)

docker build -t inventario-app:latest .
### 4. Crear el namespace
kubectl apply -f k8s/namespace/namespace.yaml
### 5. Crear los Secrets
kubectl create secret generic mysql-secret 
--from-literal=MYSQL_ROOT_PASSWORD=RootPass2024! 
--from-literal=MYSQL_USER=app_user 
--from-literal=MYSQL_PASSWORD=AppPass2024! 
--from-literal=MYSQL_DATABASE=inventario_itu 
-n inventario-egi
kubectl create secret generic mongo-secret 
--from-literal=MONGO_INITDB_ROOT_USERNAME=mongo_admin 
--from-literal=MONGO_INITDB_ROOT_PASSWORD=MongoPass2024! 
-n inventario-egi
kubectl create secret generic ldap-secret 
--from-literal=LDAP_ADMIN_USERNAME=admin 
--from-literal=LDAP_ADMIN_PASSWORD=LdapAdmin2024! 
-n inventario-egi
kubectl create secret generic app-secret 
--from-literal=MYSQL_PASSWORD=AppPass2024! 
--from-literal=MONGO_PASSWORD=MongoPass2024! 
--from-literal=LDAP_BIND_PASSWORD=LdapAdmin2024! 
'--from-literal=JWT_SECRET_KEY=JwtSuperSecretEGI2024!!' 
-n inventario-egi
### 6. Aplicar manifiestos
kubectl apply -f k8s/pvc/ -n inventario-egi

kubectl apply -f k8s/configmaps/ -n inventario-egi

kubectl apply -f k8s/deployments/ -n inventario-egi

kubectl apply -f k8s/services/ -n inventario-egi

kubectl apply -f k8s/networkpolicies/ -n inventario-egi
Esperado: 4 pods en estado Running (app, ldap, mongo, mysql)

### 8. Cargar datos en MySQL
MYSQL_POD=$(kubectl get pod -n inventario-egi -l app=mysql -o jsonpath='{.items[0].metadata.name}')

kubectl cp db/sql/schema.sql inventario-egi/$MYSQL_POD:/tmp/schema.sql

kubectl cp db/sql/datos_prueba.sql inventario-egi/$MYSQL_POD:/tmp/datos.sql

kubectl exec -n inventario-egi $MYSQL_POD -- bash -c "mysql -u root -pRootPass2024! < /tmp/schema.sql"

kubectl exec -n inventario-egi $MYSQL_POD -- bash -c "mysql -u root -pRootPass2024! < /tmp/datos.sql"

kubectl exec -it -n inventario-egi $MYSQL_POD -- mysql -u root -pRootPass2024!
Dentro de MySQL:
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'AppPass2024!';

GRANT ALL ON inventario_itu.* TO 'app_user'@'%';

FLUSH PRIVILEGES;

EXIT;
### 9. Cargar datos en MongoDB
MONGO_POD=$(kubectl get pod -n inventario-egi -l app=mongo -o jsonpath='{.items[0].metadata.name}')

kubectl cp db/mongo/seed.json inventario-egi/$MONGO_POD:/tmp/seed.json

kubectl exec -n inventario-egi $MONGO_POD -- mongoimport 
-u mongo_admin -p MongoPass2024! 
--authenticationDatabase admin 
--db inventario_itu --collection hardware 
--file /tmp/seed.json --jsonArray
### 10. Crear usuarios en OpenLDAP
LDAP_POD=$(kubectl get pod -n inventario-egi -l app=ldap -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it -n inventario-egi $LDAP_POD -- bash
kubectl port-forward -n inventario-egi svc/inventario-app-service 8080:5000
Abrir: http://localhost:8080

Usuarios de prueba:
- admin01@itu.edu.ar / admin123
- docente01@itu.edu.ar / docente123
- alumno01@itu.edu.ar / alumno123

---

## Proximas veces (ya desplegado)
minikube start --driver=docker --cni=calico

eval $(minikube docker-env)

kubectl get pods -n inventario-egi

kubectl port-forward -n inventario-egi svc/inventario-app-service 8080:5000
---

## Comandos utiles para la demo
Ver pods
kubectl get pods -n inventario-egi
Ver NetworkPolicies (Zero Trust)
kubectl get networkpolicies -n inventario-egi
Shell MongoDB para queries en vivo
kubectl exec -it -n inventario-egi 
$(kubectl get pod -n inventario-egi -l app=mongo -o jsonpath='{.items[0].metadata.name}') 
-- mongosh -u mongo_admin -p MongoPass2024! --authenticationDatabase admin inventario_itu
Logs de la app
kubectl logs -n inventario-egi -l app=inventario-app --tail=50
Reiniciar la app
kubectl rollout restart deployment/app-deployment -n inventario-egi
---

## Estructura del repositorio
MATE-ProyectoEGI/

├── app.py                 # Flask backend (Integrante 5)

├── Dockerfile             # Imagen Docker (Integrante 4)

├── requirements.txt

├── frontend/              # HTML/CSS/JS (Integrante 5)

├── db/

│   ├── sql/               # MySQL schema + datos (Integrante 2)

│   └── mongo/             # MongoDB seed + queries (Integrante 3)

└── k8s/                   # Manifiestos Kubernetes (Integrantes 1 y 4)

├── namespace/

├── pvc/

├── configmaps/

├── secrets/           # gitignored

├── deployments/

├── services/

└── networkpolicies/   # Zero Trust
