from flask import Flask, request, jsonify
import sqlite3
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from dotenv import load_dotenv
import os
import datetime

app = Flask(__name__)

# Load environment variables
load_dotenv()

# JWT configuration
app.config['JWT_SECRET_KEY'] = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)
jwt = JWTManager(app)

# Enable CORS for React frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}})

# SQLite database setup for users and patients
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    # Table for user credentials (for login)
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT UNIQUE NOT NULL, 
                  password TEXT NOT NULL)''')
    # Table for patient data (from RegisterPage)
    c.execute('''CREATE TABLE IF NOT EXISTS patients 
                 (id TEXT PRIMARY KEY, 
                  firstName TEXT NOT NULL, 
                  lastName TEXT NOT NULL, 
                  email TEXT NOT NULL, 
                  phoneNumber TEXT, 
                  dob TEXT, 
                  gender TEXT, 
                  address TEXT, 
                  emergencyContact TEXT, 
                  emergencyPhone TEXT, 
                  height INTEGER, 
                  preWeight INTEGER, 
                  currentWeight INTEGER, 
                  bloodGroup TEXT, 
                  lmp TEXT, 
                  dueDate TEXT, 
                  primaryProvider TEXT, 
                  preferredHospital TEXT, 
                  gravida INTEGER, 
                  para INTEGER, 
                  preexistingConditions TEXT, 
                  otherCondition TEXT)''')
    conn.commit()
    conn.close()

# Signup route (for creating a new user)
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                  (username, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User created successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username already exists'}), 400

# Login route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()

    if user and check_password_hash(user[2], password):  # user[2] is password column
        access_token = create_access_token(identity=username)
        return jsonify({'access_token': access_token, 'username': username}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

# Register patient data (after login)
@app.route('/register-patient', methods=['POST'])
@jwt_required()
def register_patient():
    current_user = get_jwt_identity()
    data = request.get_json()

    # Extract patient data from the request
    patient_data = {
        'id': data.get('id'),
        'firstName': data.get('firstName'),
        'lastName': data.get('lastName'),
        'email': data.get('email'),
        'phoneNumber': data.get('phoneNumber'),
        'dob': data.get('dob'),
        'gender': data.get('gender'),
        'address': data.get('address'),
        'emergencyContact': data.get('emergencyContact'),
        'emergencyPhone': data.get('emergencyPhone'),
        'height': data.get('height'),
        'preWeight': data.get('preWeight'),
        'currentWeight': data.get('currentWeight'),
        'bloodGroup': data.get('bloodGroup'),
        'lmp': data.get('lmp'),
        'dueDate': data.get('dueDate'),
        'primaryProvider': data.get('primaryProvider'),
        'preferredHospital': data.get('preferredHospital'),
        'gravida': data.get('gravida'),
        'para': data.get('para'),
        'preexistingConditions': ','.join(data.get('preexistingConditions', [])),
        'otherCondition': data.get('otherCondition'),
    }

    # Validate required fields
    if not all([patient_data['id'], patient_data['firstName'], patient_data['lastName'], patient_data['email'], patient_data['lmp']]):
        return jsonify({'message': 'Missing required fields'}), 400

    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO patients 
                     (id, firstName, lastName, email, phoneNumber, dob, gender, address, 
                      emergencyContact, emergencyPhone, height, preWeight, currentWeight, 
                      bloodGroup, lmp, dueDate, primaryProvider, preferredHospital, 
                      gravida, para, preexistingConditions, otherCondition) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (patient_data['id'], patient_data['firstName'], patient_data['lastName'], 
                   patient_data['email'], patient_data['phoneNumber'], patient_data['dob'], 
                   patient_data['gender'], patient_data['address'], patient_data['emergencyContact'], 
                   patient_data['emergencyPhone'], patient_data['height'], patient_data['preWeight'], 
                   patient_data['currentWeight'], patient_data['bloodGroup'], patient_data['lmp'], 
                   patient_data['dueDate'], patient_data['primaryProvider'], 
                   patient_data['preferredHospital'], patient_data['gravida'], patient_data['para'], 
                   patient_data['preexistingConditions'], patient_data['otherCondition']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient data saved successfully', 'patientId': patient_data['id']}), 201
    except sqlite3.Error as e:
        return jsonify({'message': f'Error saving patient data: {str(e)}'}), 500

# Get patient data (for dashboard)
@app.route('/patient-data', methods=['GET'])
@jwt_required()
def get_patient_data():
    current_user = get_jwt_identity()
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE email = (SELECT email FROM patients WHERE email IN (SELECT email FROM patients) LIMIT 1)")
    patient = c.fetchone()
    conn.close()

    if not patient:
        return jsonify({'message': 'Patient not found'}), 404

    patient_data = {
        'id': patient[0],
        'firstName': patient[1],
        'lastName': patient[2],
        'email': patient[3],
        'phoneNumber': patient[4],
        'dob': patient[5],
        'gender': patient[6],
        'address': patient[7],
        'emergencyContact': patient[8],
        'emergencyPhone': patient[9],
        'height': patient[10],
        'preWeight': patient[11],
        'currentWeight': patient[12],
        'bloodGroup': patient[13],
        'lmp': patient[14],
        'dueDate': patient[15],
        'primaryProvider': patient[16],
        'preferredHospital': patient[17],
        'gravida': patient[18],
        'para': patient[19],
        'preexistingConditions': patient[20].split(',') if patient[20] else [],
        'otherCondition': patient[21],
    }
    return jsonify(patient_data), 200

# Protected task route (for demonstration)
@app.route('/tasks', methods=['GET'])
@jwt_required()
def tasks():
    current_user = get_jwt_identity()
    tasks = [
        {"id": 1, "title": "Complete project"},
        {"id": 2, "title": "Review code"},
        {"id": 3, "title": "Take a break"}
    ]
    return jsonify({'username': current_user, 'tasks': tasks}), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)