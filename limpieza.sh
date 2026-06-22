#!/bin/bash
# ============================================================================
# CIERRE FINAL — VM del Laboratorio (EGI)
# Ejecutar DENTRO de la VM Ubuntu con Adaptador Puente, conectada a pfSense
# Uso: bash cierre_laboratorio.sh
# ============================================================================

set -e
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}OK${NC}  $1"; }
warn() { echo -e "${YELLOW}!!${NC}  $1"; }
fail() { echo -e "${RED}FALLO${NC}  $1"; }

echo "============================================================"
echo " CIERRE FINAL DEL PROYECTO EGI — VM del Laboratorio"
echo "============================================================"
echo ""

# Pedir confirmación de la carpeta del proyecto
read -p "Ruta del repo (ej: ~/EGI/MATE-ProyectoEGI): " REPO_PATH
REPO_PATH="${REPO_PATH/#\~/$HOME}"

if [ ! -d "$REPO_PATH" ]; then
    fail "No existe la carpeta $REPO_PATH"
    exit 1
fi
cd "$REPO_PATH"
ok "Carpeta del proyecto encontrada: $REPO_PATH"
echo ""

# ── PASO 1 — Verificar Minikube ──────────────────────────────────────────────
echo "[1/8] Verificando Minikube..."
if ! minikube status > /dev/null 2>&1; then
    warn "Minikube no está corriendo. Iniciando..."
    minikube start --driver=docker --cni=calico
else
    ok "Minikube ya está corriendo"
fi
echo ""

# ── PASO 2 — Verificar que Calico está activo ───────────────────────────────
echo "[2/8] Verificando CNI Calico..."
if kubectl get pods -n kube-system 2>/dev/null | grep -q calico; then
    ok "Calico está activo (las NetworkPolicies tienen efecto real)"
else
    fail "Calico NO está activo. Las NetworkPolicies NO van a funcionar."
    warn "Reiniciar con: minikube start --driver=docker --cni=calico"
fi
echo ""

# ── PASO 3 — Quitar el campo de debug del login ─────────────────────────────
echo "[3/8] Limpiando código antes de la entrega..."
if [ -f app.py ] && grep -q "'debug': str(e)" app.py 2>/dev/null; then
    python3 << 'PYEOF'
with open("app.py", "r") as f:
    content = f.read()
old = """    except Exception as e:
        return jsonify({'ok': False, 'error': 'Credenciales incorrectas', 'debug': str(e)}), 401"""
new = """    except Exception:
        return jsonify({'ok': False, 'error': 'Credenciales incorrectas'}), 401"""
content = content.replace(old, new, 1)
with open("app.py", "w") as f:
    f.write(content)
print("  Campo de debug eliminado de app.py")
PYEOF
    ok "Debug temporal quitado de app.py"
else
    ok "No se encontró campo de debug (ya estaba limpio)"
fi
echo ""

# ── PASO 4 — Rebuildear la imagen sin el debug ──────────────────────────────
echo "[4/8] Reconstruyendo la imagen de la app..."
eval $(minikube docker-env)
docker build -t inventario-app:latest . -q
kubectl rollout restart deployment/app-deployment -n inventario-egi
kubectl wait --for=condition=ready pod -l app=inventario-app -n inventario-egi --timeout=90s
ok "Imagen reconstruida y desplegada"
echo ""

# ── PASO 5 — Verificar todos los pods ───────────────────────────────────────
echo "[5/8] Verificando todos los pods del namespace..."
kubectl get pods -n inventario-egi
echo ""
NOT_RUNNING=$(kubectl get pods -n inventario-egi --no-headers 2>/dev/null | grep -v "Running" | wc -l)
if [ "$NOT_RUNNING" -eq 0 ]; then
    ok "Los 4 pods están en estado Running"
else
    fail "Hay $NOT_RUNNING pod(s) que no están Running — revisar antes de la defensa"
fi
echo ""

# ── PASO 6 — Verificar NetworkPolicies ──────────────────────────────────────
echo "[6/8] Verificando NetworkPolicies..."
NP_COUNT=$(kubectl get networkpolicies -n inventario-egi --no-headers 2>/dev/null | wc -l)
if [ "$NP_COUNT" -ge 4 ]; then
    ok "Las 4 NetworkPolicies están aplicadas"
    kubectl get networkpolicies -n inventario-egi
else
    fail "Faltan NetworkPolicies (hay $NP_COUNT, deberían ser 4)"
fi
echo ""

# ── PASO 7 — Verificar GUFW ──────────────────────────────────────────────────
echo "[7/8] Verificando GUFW..."
if command -v ufw > /dev/null 2>&1; then
    sudo ufw status verbose
    ok "GUFW verificado (revisar arriba que el estado sea 'active')"
else
    warn "GUFW (ufw) no está instalado en esta máquina"
fi
echo ""

# ── PASO 8 — Prueba end-to-end del flujo completo ───────────────────────────
echo "[8/8] Probando el flujo completo de la app..."
pkill -f "port-forward" 2>/dev/null || true
sleep 2
kubectl port-forward -n inventario-egi svc/inventario-app-service 8080:5000 > /tmp/portforward.log 2>&1 &
sleep 3

HEALTH=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status"'; then
    ok "Endpoint /api/health responde correctamente"
    echo "    $HEALTH"
else
    fail "El endpoint /api/health no responde. Revisar el port-forward."
fi
echo ""

read -p "¿Probar el login con docente01@itu.local / Itu12345! ? (s/n): " DO_LOGIN
if [ "$DO_LOGIN" = "s" ]; then
    LOGIN_RESULT=$(curl -s -X POST http://localhost:8080/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"docente01@itu.local","password":"Itu12345!"}')
    if echo "$LOGIN_RESULT" | grep -q '"ok":true'; then
        ok "Login exitoso contra Active Directory"
    else
        fail "Login falló. Respuesta: $LOGIN_RESULT"
        warn "Verificar que el usuario docente01 existe en el AD y la contraseña es correcta"
    fi
fi
echo ""

# ── COMMIT FINAL ─────────────────────────────────────────────────────────────
echo "============================================================"
echo " RESUMEN — Próximos pasos manuales"
echo "============================================================"
echo ""
echo "Si todo lo anterior salió OK, subir los cambios al repositorio:"
echo ""
echo "  git add app.py"
echo "  git commit -m 'chore: limpieza final antes de la defensa'"
echo "  git push origin <tu-rama>"
echo ""
echo "Para acceder a la app durante la defensa:"
echo "  minikube service inventario-app-service -n inventario-egi --url"
echo ""
echo "  o si ya tenés el port-forward corriendo (este script lo dejó activo):"
echo "  http://localhost:8080"
echo ""
echo "Usuarios de prueba en el AD:"
echo "  docente01@itu.local / Itu12345!"
echo ""
echo "============================================================"
echo " Cierre completado."
echo "============================================================"
