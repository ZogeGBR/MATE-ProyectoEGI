# EGI — Ecosistema de Inventario Seguro

**Proyecto Integrador — ITU UNCUYO**

Sistema de inventario de equipos informáticos para los laboratorios de la institución. La aplicación consulta **SQL Server** (ubicación, responsable, mantenimiento) y **MongoDB** (hardware instalado), autenticando usuarios contra un **Active Directory** institucional real, todo desplegado en **Kubernetes** detrás de un firewall perimetral **pfSense + GUFW**.

📄 **Ver [`LEEME.md`](./LEEME.md)** para la guía completa de instalación, despliegue y comandos de la demo.

📋 **Ver [`docs/Informe_Formal_EGI.pdf`](./docs/Informe_Formal_EGI.pdf)** para el informe técnico completo con justificaciones de diseño y proceso de testing.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Flask (Python) + Gunicorn |
| Autenticación | Active Directory / LDAP real (`itu.local`) + JWT |
| Base relacional | SQL Server real (Windows) — MySQL como respaldo interno |
| Base documental | MongoDB |
| Orquestación | Kubernetes (Minikube + Calico) |
| Seguridad de red | NetworkPolicies (Zero Trust) + pfSense + GUFW |
| CI/CD | GitHub Actions (self-hosted runner) |

## Arquitectura

```
Internet/laboratorio → pfSense → GUFW → Minikube (namespace inventario-egi)
                           │                    │
                  AD + SQL Server real    app-deployment (Flask)
                  (Windows, vía NAT)             │
                                      mongo-deployment (interno)
```

## Estructura del repositorio

```
├── app.py                  # Backend Flask
├── Dockerfile
├── requirements.txt
├── limpieza.sh             # Script de cierre/limpieza antes de la defensa
├── frontend/                # HTML/CSS/JS
├── db/
│   ├── sql/                 # Schema y datos MySQL
│   └── mongo/                # Seed y queries MongoDB
├── k8s/                     # Manifiestos Kubernetes
│   ├── namespace/  pvc/  configmaps/  secrets/
│   └── deployments/  services/  networkpolicies/
├── .github/workflows/        # Pipeline de CI/CD
└── docs/                     # Informe formal, diagramas, presentación
```

## Estado del proyecto

✅ Funcional — verificado mediante pipeline de CI/CD (ver pestaña **Actions**)

## Equipo

5 integrantes — ver detalle de roles en `LEEME.md` y en el informe formal.
