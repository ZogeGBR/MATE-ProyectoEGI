# Infraestructura y Seguridad de Red
**Integrante 1 — Linux · GUFW · Minikube · NetworkPolicies**

## Arquitectura de servicios

| Servicio  | Nombre DNS interno         | Puerto | Tipo      | Acceso externo  |
|-----------|----------------------------|--------|-----------|-----------------|
| App Flask | inventario-app-service     | 5000   | NodePort  | Sí — :30080     |
| MySQL     | mysql-service              | 3306   | ClusterIP | No              |
| MongoDB   | mongo-service              | 27017  | ClusterIP | No              |
| OpenLDAP  | ldap-service               | 389    | ClusterIP | No              |

Todos los recursos viven en el namespace `inventario-egi`.

## Firewall perimetral — GUFW/UFW

Sistema operativo: Ubuntu 22.04
Política por defecto: incoming → DENY | outgoing → ALLOW

| Puerto  | Protocolo | Regla | Justificación                     |
|---------|-----------|-------|-----------------------------------|
| 22      | TCP       | ALLOW | SSH nativo Ubuntu                 |
| 2222    | TCP       | ALLOW | Port forwarding VirtualBox        |
| 80      | TCP       | ALLOW | HTTP estándar                     |
| 443     | TCP       | ALLOW | HTTPS estándar                    |
| 8080    | TCP       | ALLOW | HTTP alternativo                  |
| 30080   | TCP       | ALLOW | NodePort de la app web (Minikube) |

## NetworkPolicies — Zero Trust

Ubicación: `k8s/networkpolicies/`
Requiere: `minikube start --cni=calico`

| Archivo                            | Qué hace                                               |
|------------------------------------|--------------------------------------------------------|
| 01-deny-all.yaml                   | Bloquea todo ingress y egress en el namespace          |
| 02-allow-app-to-databases.yaml     | Permite que inventario-app acceda a mysql, mongo, ldap |
| 03-allow-app-egress.yaml           | Permite salida de la app hacia BDs y DNS (:53)         |
| 04-allow-external-to-app.yaml      | Permite tráfico externo al puerto 5000 de la app       |

## Cómo levantar el entorno desde cero

```bash
minikube start --driver=docker --cni=calico --memory=4096 --cpus=2
kubectl apply -f k8s/ --recursive
minikube service inventario-app-service -n inventario-egi --url
```

## Verificación del deny-all (demo defensa)

```bash
kubectl run test-deny --image=busybox:1.28 --restart=Never -n inventario-egi -- sleep 300
kubectl exec -it test-deny -n inventario-egi -- nc -zv mysql-service 3306
# Esperado: timeout → deny-all activo ✓
kubectl delete pod test-deny -n inventario-egi
```

## Nota de compatibilidad

MongoDB 7.0 requiere instrucción AVX del CPU. En VirtualBox esta instrucción
no está disponible, por lo que se usa mongo:4.4 como imagen alternativa compatible.
