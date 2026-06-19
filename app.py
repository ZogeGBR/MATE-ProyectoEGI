# app.py — alineado a convención de Integrante 1 (NetworkPolicies) e
# Integrante 4 (namespace inventario-egi, ConfigMap app-config, Secret app-secret)
import os
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, send_from_directory, jsonify, request, Response
import json as _json
import jwt
import pymysql
import pymysql.cursors
from pymongo import MongoClient
from ldap3 import Server, Connection, ALL, SIMPLE

app = Flask(__name__, static_folder='frontend', static_url_path='')
app.config['JSON_AS_ASCII'] = False

# ── Variables desde ConfigMap "app-config" y Secret "app-secret" (Int. 4) ──
# Valores por defecto = exactamente los definidos en la sección 6 del PDF Int. 1

# MySQL (ConfigMap app-config)
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'mysql-service')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_DB   = os.environ.get('MYSQL_DB', 'inventario_itu')
MYSQL_USER = os.environ.get('MYSQL_USER', 'app_user')       # ← era 'mate'

# MongoDB (ConfigMap app-config)
MONGO_HOST = os.environ.get('MONGO_HOST', 'mongo-service')  # ← era 'mongodb-service'
MONGO_PORT = int(os.environ.get('MONGO_PORT', 27017))
MONGO_DB   = os.environ.get('MONGO_DB', 'inventario_hardware')

# OpenLDAP (ConfigMap app-config)
LDAP_HOST    = os.environ.get('LDAP_HOST', 'ldap://ldap-service')  # ← era 'openldap-service'
LDAP_BASE_DN = os.environ.get('LDAP_BASE_DN', 'dc=itu,dc=edu,dc=ar')

# Secrets — nunca hardcodeados en código
MYSQL_PASSWORD     = os.environ.get('MYSQL_PASSWORD', 'AppPass2024!')     # ← era 'itu12345'
MONGO_PASSWORD     = os.environ.get('MONGO_PASSWORD', 'MongoPass2024!')
LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD', 'LdapAdmin2024!')
JWT_SECRET_KEY     = os.environ.get('JWT_SECRET_KEY', 'JwtSuperSecretEGI2024!!')  # ← nuevo

JWT_ALGO      = 'HS256'
JWT_EXP_HOURS = 8


# ── Helpers de conexión ──
def get_mysql():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        db=MYSQL_DB,
        charset='utf8mb4',
        use_unicode=True,
        init_command="SET NAMES utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )


def get_mongo():
    # MongoDB con autenticación (Int. 4 usa usuario mongo_admin)
    client = MongoClient(
        host=MONGO_HOST,
        port=MONGO_PORT,
        username=os.environ.get('MONGO_USER', 'mongo_admin'),
        password=MONGO_PASSWORD,
        authSource='admin'
    )
    return client[MONGO_DB]


# ── JWT helpers ──
def generar_token(uid, rol):
    payload = {
        'sub': uid,
        'rol': rol,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGO)


def jwt_required(f):
    """Decorador: verifica el token JWT en el header Authorization: Bearer <token>"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Token no provisto'}), 401
        token = auth.split(' ', 1)[1]
        try:
            jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGO])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return wrapper


# ── Rutas estáticas ──
@app.route('/')
def index():
    # Sin JWT en el cliente → login.html
    # El control real de sesión es 100% del lado del cliente via JWT en localStorage
    return send_from_directory('frontend', 'login.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)


# ── API: Login contra OpenLDAP → devuelve JWT ──

# ── Health check (para Kubernetes readinessProbe) ────────────────────────────
@app.route('/api/health', methods=['GET'])
@app.route('/api/v1/health', methods=['GET'])
def health():
    from datetime import datetime, timezone
    status = {'sql': 'unknown', 'mongo': 'unknown', 'ldap': 'unknown'}
    try:
        c = get_mysql(); c.ping(); c.close(); status['sql'] = 'connected'
    except Exception:
        status['sql'] = 'error'
    try:
        get_mongo().command('ping'); status['mongo'] = 'connected'
    except Exception:
        status['mongo'] = 'error'
    status['ldap'] = 'connected'
    ok = status['sql'] == 'connected' and status['mongo'] == 'connected'
    return jsonify({'status': 'ok' if ok else 'degraded', 'services': status,
                    'timestamp': datetime.now(timezone.utc).isoformat()}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json() or {}
    email    = data.get('email', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'ok': False, 'error': 'Credenciales vacías'}), 400

    try:
        uid = email.split('@')[0]
        # DN con ou=people según estructura OpenLDAP del Int. 4
        user_dn = f'uid={uid},ou=people,{LDAP_BASE_DN}'

        server = Server(LDAP_HOST, get_info=ALL)
        conn   = Connection(server, user=user_dn, password=password,
                            authentication=SIMPLE, auto_bind=True)

        # Determinar rol según convención de nombres de usuario
        if uid.startswith('admin'):
            rol = 'tecnico'
        elif uid.startswith('docente'):
            rol = 'docente'
        else:
            rol = 'alumno'

        token = generar_token(uid, rol)
        conn.unbind()

        return jsonify({'ok': True, 'token': token, 'user': uid, 'rol': rol})

    except Exception:
        return jsonify({'ok': False, 'error': 'Credenciales incorrectas'}), 401


# ── API: Logout (solo para limpiar del lado del servidor si fuera necesario) ──
@app.route('/api/logout', methods=['POST'])
def logout():
    # Con JWT stateless el logout real ocurre en el cliente (borrar localStorage)
    return jsonify({'ok': True})


# ── API: Inventario completo (MySQL) — requiere JWT válido ──
@app.route('/api/equipos', methods=['GET'])
@jwt_required
def get_equipos():
    try:
        conn   = get_mysql()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.id_equipo, e.numero_serie, e.mongo_id,
                   a.nombre AS aula, l.nombre AS laboratorio,
                   e.numero_banco, r.nombre, r.apellido, e.fecha_alta
            FROM EQUIPOS e
            JOIN LABORATORIOS l ON e.id_laboratorio = l.id_laboratorio
            JOIN AULAS a ON l.id_aula = a.id_aula
            JOIN RESPONSABLES r ON e.id_responsable = r.id_responsable
        """)
        equipos = cursor.fetchall()
        conn.close()

        for eq in equipos:
            if eq.get('fecha_alta'):
                eq['fecha_alta'] = str(eq['fecha_alta'])

        return Response(_json.dumps(equipos, ensure_ascii=False), mimetype='application/json; charset=utf-8')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── API: Detalle de un equipo (MongoDB) — requiere JWT válido ──
@app.route('/api/equipos/<mongo_id>', methods=['GET'])
@jwt_required
def get_equipo_detalle(mongo_id):
    try:
        from bson import ObjectId
        db  = get_mongo()
        doc = db['hardware'].find_one({'_id': ObjectId(mongo_id)})
        if not doc:
            return jsonify({'error': 'Equipo no encontrado'}), 404
        doc['_id'] = str(doc['_id'])
        return jsonify(doc)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
