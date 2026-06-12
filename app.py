# app.py — versión completa con APIs integradas
import os
from flask import Flask, send_from_directory, jsonify, request, session
import pymysql
import pymysql.cursors
from pymongo import MongoClient
from ldap3 import Server, Connection, ALL, SIMPLE

app = Flask(__name__, static_folder='frontend', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'itu-egi-secret-2024')

# ── Configuración desde variables de entorno (K8s ConfigMap/Secret) ──
MYSQL_HOST     = os.environ.get('MYSQL_HOST', 'mysql-service')
MYSQL_PORT     = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_USER     = os.environ.get('MYSQL_USER', 'mate')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'itu12345')
MYSQL_DB       = os.environ.get('MYSQL_DB', 'inventario_itu')

MONGO_HOST     = os.environ.get('MONGO_HOST', 'mongodb-service')
MONGO_PORT     = int(os.environ.get('MONGO_PORT', 27017))

LDAP_HOST      = os.environ.get('LDAP_HOST', 'ldap://openldap-service')
LDAP_BASE_DN   = os.environ.get('LDAP_BASE_DN', 'dc=itu,dc=edu,dc=ar')

# ── Helpers de conexión ──
def get_mysql():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        db=MYSQL_DB,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def get_mongo():
    client = MongoClient(MONGO_HOST, MONGO_PORT)
    return client['inventario_hardware']

# ── Rutas estáticas ──
@app.route('/')
def index():
    if 'user' not in session:
        return send_from_directory('frontend', 'login.html')
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

# ── API: Login contra OpenLDAP ──
@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'ok': False, 'error': 'Credenciales vacías'}), 400

    try:
        # Construir el DN del usuario a partir del email
        uid = email.split('@')[0]
        user_dn = f'uid={uid},{LDAP_BASE_DN}'

        server = Server(LDAP_HOST, get_info=ALL)
        conn   = Connection(server, user=user_dn, password=password,
                            authentication=SIMPLE, auto_bind=True)

        # Login exitoso
        session['user'] = email
        return jsonify({'ok': True, 'user': email})

    except Exception as e:
        return jsonify({'ok': False, 'error': 'Credenciales incorrectas'}), 401

# ── API: Logout ──
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})

# ── API: Inventario (MySQL) ──
@app.route('/api/equipos', methods=['GET'])
def get_equipos():
    try:
        conn   = get_mysql()
        cursor = conn.cursor()
        cursor.execute("""
                       SELECT e.id_equipo, e.numero_serie, e.mongo_id,
                              a.nombre AS aula, l.nombre AS laboratorio,
                              e.numero_banco, r.nombre, r.apellido, e.fecha_alta
                       FROM equipos e
                                JOIN laboratorios l ON e.id_laboratorio = l.id_laboratorio
                                JOIN aulas a ON l.id_aula = a.id_aula
                                JOIN responsables r ON e.id_responsable = r.id_responsable
                       """)
        equipos = cursor.fetchall()
        conn.close()

        # Serializar fechas
        for eq in equipos:
            if eq.get('fecha_alta'):
                eq['fecha_alta'] = str(eq['fecha_alta'])

        return jsonify(equipos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── API: Detalle de equipo (MongoDB) ──
@app.route('/api/equipos/<mongo_id>', methods=['GET'])
def get_equipo_detalle(mongo_id):
    try:
        from bson import ObjectId
        db  = get_mongo()
        doc = db['hardware'].find_one({'_id': ObjectId(mongo_id)})
        if not doc:
            return jsonify({'error': 'Equipo no encontrado'}), 404
        doc['_id'] = str(doc['_id'])   # ObjectId no es serializable
        return jsonify(doc)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)