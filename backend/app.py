from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour

jwt = JWTManager(app)

# In-memory database (for simplicity)
users_db = {
    'admin@example.com': {
        'password': 'admin123',
        'name': 'Admin User',
        'role': 'admin'
    },
    'user@example.com': {
        'password': 'user123',
        'name': 'Regular User',
        'role': 'user'
    }
}

tickets_db = [
    {
        'id': 1,
        'title': 'Cannot login to dashboard',
        'description': 'Getting 404 error when trying to access dashboard',
        'status': 'open',
        'priority': 'high',
        'created_by': 'user@example.com',
        'assigned_to': 'admin@example.com',
        'created_at': '2024-01-15 10:30:00',
        'updated_at': '2024-01-15 10:30:00'
    },
    {
        'id': 2,
        'title': 'Add new feature request',
        'description': 'Please add export to PDF functionality',
        'status': 'in_progress',
        'priority': 'medium',
        'created_by': 'user@example.com',
        'assigned_to': 'admin@example.com',
        'created_at': '2024-01-14 14:20:00',
        'updated_at': '2024-01-15 09:15:00'
    }
]

# Counter for ticket IDs
ticket_counter = len(tickets_db)

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    user = users_db.get(email)
    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create access token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'email': email,
            'name': user['name'],
            'role': user['role']
        }
    }), 200

# Ticket routes
@app.route('/api/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    current_user = get_jwt_identity()
    user_role = users_db[current_user]['role']
    
    # Admin sees all tickets, users see only their tickets
    if user_role == 'admin':
        return jsonify(tickets_db), 200
    else:
        user_tickets = [t for t in tickets_db if t['created_by'] == current_user]
        return jsonify(user_tickets), 200

@app.route('/api/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    global ticket_counter
    current_user = get_jwt_identity()
    data = request.get_json()
    
    # Validation
    required_fields = ['title', 'description', 'priority']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Create new ticket
    ticket_counter += 1
    new_ticket = {
        'id': ticket_counter,
        'title': data['title'],
        'description': data['description'],
        'status': 'open',
        'priority': data['priority'],
        'created_by': current_user,
        'assigned_to': 'admin@example.com',  # Default assign to admin
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    tickets_db.append(new_ticket)
    return jsonify(new_ticket), 201

@app.route('/api/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket(ticket_id):
    current_user = get_jwt_identity()
    user_role = users_db[current_user]['role']
    data = request.get_json()
    
    # Find ticket
    ticket = next((t for t in tickets_db if t['id'] == ticket_id), None)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    # Check permissions
    if user_role != 'admin' and ticket['created_by'] != current_user:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Update allowed fields
    allowed_fields = ['status', 'priority', 'assigned_to']
    for field in allowed_fields:
        if field in data:
            ticket[field] = data[field]
    
    ticket['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify(ticket), 200

@app.route('/api/tickets/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_ticket(ticket_id):
    current_user = get_jwt_identity()
    user_role = users_db[current_user]['role']
    
    # Find ticket
    ticket_index = next((i for i, t in enumerate(tickets_db) if t['id'] == ticket_id), None)
    if ticket_index is None:
        return jsonify({'error': 'Ticket not found'}), 404
    
    # Check permissions (only admin can delete)
    if user_role != 'admin':
        return jsonify({'error': 'Not authorized'}), 403
    
    deleted_ticket = tickets_db.pop(ticket_index)
    return jsonify({'message': 'Ticket deleted successfully', 'ticket': deleted_ticket}), 200

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ticket-system'}), 200

# Get current user info
@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user = get_jwt_identity()
    user = users_db.get(current_user)
    if user:
        return jsonify({
            'email': current_user,
            'name': user['name'],
            'role': user['role']
        }), 200
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)