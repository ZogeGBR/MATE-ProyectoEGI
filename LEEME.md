# EGI — Ecosistema de Inventario Seguro
### ITU UNCUYO — Proyecto Integrador

---

## Arquitectura

```
Internet / wifi laboratorio
        │
     pfSense  (WAN 172.22.75.83  →  LAN/SERVER 192.168.1.254)
        │                                  │
     GUFW (host Ubuntu)          AD Windows (192.168.1.10:389)
        │                          SQL Server (192.168.1.20:3306)
   Minikube + Calico
   namespace: inventario-egi
        │
   app-deployment (Flask) ──┬──▶ AD/SQL reales (vía pfSense)
                             └──▶ mongo-deployment (interno, K8s)
```

La app se autentica contra un **Active Directory real** y consulta un **SQL Server real**, ambos en infraestructura Windows del laboratorio, atravesando **pfSense**. MongoDB y un MySQL de respaldo siguen corriendo dentro del propio clúster.

---

## Requisitos previos

- Ubuntu 22.04 (VM con **Adaptador Puente**, en la misma red física que pfSense — *no* WSL2, que usa una red NAT virtual aislada)
- Docker + Minikube + kubectl instalados
- Acceso de red a la IP WAN de pfSense (verificar con `ip a`)

---

## Levantar el proyecto (primera vez en una VM nueva)

### 1. Clonar el repo
```bash
git clone https://github.com/ZogeGBR/MATE-ProyectoEGI.git
cd MATE-ProyectoEGI
git checkout EGI-Final
```

### 2. Iniciar Minikube con Calico
```bash
minikube start --driver=docker --cni=calico --memory=4096 --cpus=2
```
> Sin `--cni=calico` las NetworkPolicies se aplican pero **no bloquean nada realmente**.

### 3. Buildear la imagen de la app
```bash
eval $(minikube docker-env)
docker build -t inventario-app:latest .
```

### 4. Crear el namespace
```bash
kubectl apply -f k8s/namespace/namespace.yaml
```

### 5. Crear los Secrets (nunca están en el repo — hay que recrearlos en cada VM nueva)
```bash
kubectl create secret generic mysql-secret \
  --from-literal=MYSQL_ROOT_PASSWORD=RootPass2024! \
  --from-literal=MYSQL_USER=app_user \
  --from-literal=MYSQL_PASSWORD=AppPass2024! \
  --from-literal=MYSQL_DATABASE=inventario_itu \
  -n inventario-egi

kubectl create secret generic mongo-secret \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=mongo_admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=MongoPass2024! \
  -n inventario-egi

kubectl create secret generic ldap-secret \
  --from-literal=LDAP_ADMIN_USERNAME=admin \
  --from-literal=LDAP_ADMIN_PASSWORD=LdapAdmin2024! \
  -n inventario-egi

kubectl create secret generic app-secret \
  --from-literal=MYSQL_PASSWORD=AppPass2024! \
  --from-literal=MONGO_PASSWORD=MongoPass2024! \
  --from-literal=LDAP_BIND_PASSWORD=LdapAdmin2024! \
  --from-literal=JWT_SECRET_KEY='JwtSuperSecretEGI2024!!' \
  -n inventario-egi
```

### 6. Aplicar el resto de manifiestos
```bash
kubectl apply -f k8s/pvc/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/networkpolicies/
```

Esperado: 4 pods en estado `Running` (`app`, `ldap`, `mongo`, `mysql`).
```bash
kubectl get pods -n inventario-egi
```

> ⚠️ Si algún pod (especialmente `ldap` o `mongo`) queda en `Pending`, lo más común es que falte el PVC correspondiente — verificar con `kubectl get pvc -n inventario-egi` y reaplicar `k8s/pvc/` si falta alguno.

### 7. Verificar conectividad hacia pfSense
```bash
nc -zv 172.22.75.83 389    # Active Directory
nc -zv 172.22.75.83 3306   # SQL Server
```
Si falla, confirmar que la VM tiene **Adaptador Puente** (no NAT/Red interna) y está en la misma subred que la WAN de pfSense (`ip a`).

### 8. Cargar datos en MongoDB (respaldo interno)
```bash
MONGO_POD=$(kubectl get pod -n inventario-egi -l app=mongo -o jsonpath='{.items[0].metadata.name}')
kubectl cp db/mongo/seed.json inventario-egi/$MONGO_POD:/tmp/seed.json

kubectl exec -n inventario-egi $MONGO_POD -- mongoimport \
  -u mongo_admin -p MongoPass2024! \
  --authenticationDatabase admin \
  --db inventario_itu --collection hardware \
  --file /tmp/seed.json --jsonArray
```

### 9. Crear usuarios de prueba en el Active Directory real

En la **VM del Active Directory** (no en Kubernetes), con PowerShell como administrador:
```powershell
.\crear_grupos_laboratorios.ps1
```
O manualmente, en *Usuarios y equipos de Active Directory*, dentro de la OU `UsuariosProyecto`.

### 10. Acceder a la app
```bash
kubectl port-forward -n inventario-egi svc/inventario-app-service 8080:5000
```
Abrir: `http://localhost:8080`

**Usuario de prueba real (Active Directory, dominio `itu.local`):**
```
docente01@itu.local / Itu12345!
```

---

## Próximas veces (ecosistema ya desplegado)

```bash
minikube start --driver=docker --cni=calico
eval $(minikube docker-env)
kubectl get pods -n inventario-egi
kubectl port-forward -n inventario-egi svc/inventario-app-service 8080:5000
```

---

## Limpieza y cierre antes de la defensa

El script `limpieza.sh` automatiza la verificación completa: Minikube, Calico, pods, NetworkPolicies, GUFW, y un test end-to-end de `/api/health` y login.

```bash
bash limpieza.sh
```

Te va a pedir la ruta del repo y te muestra en colores qué está OK y qué falta revisar.

---

## Integración Continua (CI/CD)

El repositorio tiene un workflow de **GitHub Actions** (`.github/workflows/deploy.yml`) que automatiza el despliegue completo cada vez que se hace push a `main` o `EGI-Final`. Corre en un **runner self-hosted** instalado en la VM del laboratorio (un runner en la nube no vería ni el clúster ni la red `172.22.x.x`).

Ver el estado de las ejecuciones en la pestaña **Actions** del repositorio.

---

## Comandos útiles para la demo

```bash
# Ver pods
kubectl get pods -n inventario-egi

# Ver NetworkPolicies (Zero Trust)
kubectl get networkpolicies -n inventario-egi

# Probar el aislamiento de red (debe FALLAR la conexión)
kubectl run test-deny --image=busybox:1.28 --restart=Never -n inventario-egi -- sleep 3600
kubectl exec -it test-deny -n inventario-egi -- nc -zv mysql-service 3306
kubectl delete pod test-deny -n inventario-egi

# Estado de GUFW
sudo ufw status verbose

# Shell de MongoDB para queries en vivo (CRUD)
kubectl exec -it -n inventario-egi \
  $(kubectl get pod -n inventario-egi -l app=mongo -o jsonpath='{.items[0].metadata.name}') \
  -- mongosh -u mongo_admin -p MongoPass2024! --authenticationDatabase admin inventario_itu

# Logs de la app
kubectl logs -n inventario-egi -l app=inventario-app --tail=50

# Reiniciar la app (rollout limpio, preferir esto sobre borrar pods individuales)
kubectl rollout restart deployment/app-deployment -n inventario-egi

# Si un Deployment acumula ReplicaSets duplicados/rotos:
kubectl delete deployment <nombre> -n inventario-egi
kubectl apply -f k8s/deployments/<nombre>-deployment.yaml
```

---

## Estructura del repositorio

```
MATE-ProyectoEGI/
├── app.py                    # Flask backend
├── Dockerfile
├── requirements.txt
├── limpieza.sh                # Cierre/verificación final
├── crear_grupos_laboratorios.ps1   # Grupos y usuarios por laboratorio en AD
├── frontend/                  # HTML/CSS/JS
├── db/
│   ├── sql/                   # MySQL schema + datos
│   └── mongo/                  # MongoDB seed + queries
├── k8s/                       # Manifiestos Kubernetes
│   ├── namespace/  pvc/  configmaps/
│   ├── secrets/                # gitignored — recrear manualmente
│   ├── deployments/  services/
│   └── networkpolicies/        # Zero Trust
├── .github/workflows/deploy.yml   # Pipeline CI/CD (self-hosted runner)
└── docs/                       # Informe formal, diagramas, presentación
```

---

## Notas de mantenimiento

- **No borrar `k8s/secrets/`** del `.gitignore`: esos archivos solo deben existir localmente en cada VM, nunca en el repo.
- **La IP de pfSense puede cambiar** si el wifi del laboratorio reasigna por DHCP. Si `/api/health` reporta `sql` o `ldap` en `error`, verificar primero `Status → Interfaces` en pfSense y actualizar `k8s/configmaps/app-config.yaml` si cambió.
- **Preferir `kubectl rollout restart`** sobre `kubectl delete pod` para evitar que queden ReplicaSets huérfanos acumulados.
