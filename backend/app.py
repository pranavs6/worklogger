from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json
import requests
from datetime import datetime, timezone, timedelta
import pandas as pd
from math import radians, cos, sin, asin, sqrt
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv('.env.production')

app = Flask(__name__)
CORS(app)

# Database configuration - Using Neon database
print("🔧 Configuring Neon database connection...")
DATABASE_URL = os.getenv('DATABASE_URL', 'NOURLHERE')
print(f"📊 Using Neon database: {DATABASE_URL[:50]}...")

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_db_connection():
    """Get database connection (create new connection each time for reliability)"""
    try:
        conn = psycopg2.connect(
            DATABASE_URL,
            connect_timeout=10,
            keepalives_idle=600,
            keepalives_interval=30,
            keepalives_count=3
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise

def init_database():
    """Initialize database tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Read and execute schema.sql
        with open('schema.sql', 'r') as f:
            schema_sql = f.read()
        
        cursor.execute(schema_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("Database tables initialized successfully")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula"""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Earth's radius in meters
    return c * r

def get_place_from_location(lat, lon):
    """Determine which place the location belongs to based on geofence"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("SELECT * FROM places")
        places = cursor.fetchall()
        
        for place in places:
            distance = calculate_distance(lat, lon, place['lat'], place['lon'])
            if distance <= place['geofence_radius']:
                cursor.close()
                conn.close()
                return place['name']
    
        cursor.close()
        conn.close()
        return "unknown"
        
    except Exception as e:
        print(f"Error getting place from location: {e}")
    return "unknown"

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now(IST).isoformat()})

@app.route('/health', methods=['GET'])
def health_check_alt():
    """Alternative health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now(IST).isoformat()})

@app.route('/api/log', methods=['POST'])
def log_event():
    """Log a new event"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['event', 'lat', 'lon']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract data
        event = data['event']
        lat = float(data['lat'])
        lon = float(data['lon'])
        notes = data.get('notes', '')
        duration_minutes = data.get('duration_minutes', 0)
        source = data.get('source', 'manual')
        
        # Determine place from location
        place_name = get_place_from_location(lat, lon)
        
        # Get place_id if place exists
        place_id = None
        if place_name != "unknown":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM places WHERE name = %s", (place_name,))
            result = cursor.fetchone()
            if result:
                place_id = result[0]
            cursor.close()
            conn.close()
        
        timestamp = datetime.now(IST)
        
        # Auto-calculate duration for exit events
        if event == 'exit' and duration_minutes == 0:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT timestamp FROM logs 
                    WHERE event = 'arrive' 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                """)
                result = cursor.fetchone()
                if result:
                    arrive_time = result[0]
                    duration_minutes = int((timestamp - arrive_time).total_seconds() / 60)
                    if duration_minutes < 0:
                        duration_minutes = 0
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Error calculating duration: {e}")
                duration_minutes = 0
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        mode = 'iPhone' if source == 'iphone' else 'Manual'
        
        cursor.execute("""
            INSERT INTO logs (timestamp, event, lat, lon, place_id, notes, duration_minutes, mode)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (timestamp, event, lat, lon, place_id, notes, duration_minutes, mode))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Event '{event}' logged successfully",
            "timestamp": timestamp.isoformat(),
            "place": place_name
        })
        
    except Exception as e:
        print(f"Error logging event: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/<event>/<lat>/<lon>', methods=['GET', 'POST'])
def log_event_url_params(event, lat, lon):
    """Log event using URL parameters - perfect for iPhone automation"""
    try:
        # Validate event type
        if event not in ['arrive', 'exit']:
            return jsonify({"error": "Event must be 'arrive' or 'exit'"}), 400
        
        # Convert coordinates to float
        try:
            lat_float = float(lat)
            lon_float = float(lon)
        except ValueError:
            return jsonify({"error": "Invalid latitude or longitude format"}), 400
        
        # Get current timestamp
        timestamp = datetime.now(IST)
        
        # Determine place from location using geofence matching
        place_name = get_place_from_location(lat_float, lon_float)
        
        # Get place_id if place exists
        place_id = None
        if place_name != "unknown":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM places WHERE name = %s", (place_name,))
            result = cursor.fetchone()
            if result:
                place_id = result[0]
            cursor.close()
            conn.close()
        
        # Auto-calculate duration for exit events
        duration_minutes = 0
        if event == 'exit':
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT timestamp FROM logs 
                    WHERE event = 'arrive' 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                """)
                result = cursor.fetchone()
                if result:
                    arrive_time = result[0]
                    duration_minutes = int((timestamp - arrive_time).total_seconds() / 60)
                    if duration_minutes < 0:
                        duration_minutes = 0
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Error calculating duration: {e}")
                duration_minutes = 0
        
        # Create notes based on event and place
        if place_name and place_name != 'unknown':
            notes = f"Automated {event} at {place_name}"
        else:
            notes = f"Automated {event} at {lat_float:.4f}, {lon_float:.4f}"
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO logs (timestamp, event, lat, lon, place_id, notes, duration_minutes, mode)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (timestamp, event, lat_float, lon_float, place_id, notes, duration_minutes, 'iPhone'))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Event '{event}' logged successfully",
            "timestamp": timestamp.isoformat(),
            "place": place_name,
            "coordinates": f"{lat_float:.4f}, {lon_float:.4f}",
            "duration_minutes": duration_minutes
        })
        
    except Exception as e:
        print(f"Error logging event via URL params: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get all logs with optional filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build query with filters
        query = """
            SELECT l.*, p.name as place_name
            FROM logs l
            LEFT JOIN places p ON l.place_id = p.id
        """
        conditions = []
        params = []
        
        # Apply filters
        date_filter = request.args.get('date')
        event_filter = request.args.get('event')
        place_filter = request.args.get('place')
        
        if date_filter:
            conditions.append("DATE(l.timestamp) = %s")
            params.append(date_filter)
        
        if event_filter:
            conditions.append("l.event = %s")
            params.append(event_filter)
            
        if place_filter:
            conditions.append("p.name = %s")
            params.append(place_filter)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY l.timestamp DESC"
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # Convert to JSON format
        logs_list = []
        for log in logs:
            log_entry = {
                'timestamp': log['timestamp'].isoformat() if log['timestamp'] else None,
                'event': log['event'],
                'lat': float(log['lat']),
                'lon': float(log['lon']),
                'place': log['place_name'] if log['place_name'] else 'unknown',
                'notes': log['notes'] if log['notes'] else '',
                'duration_minutes': int(log['duration_minutes']) if log['duration_minutes'] else 0,
                'mode': log['mode'] if log['mode'] else 'Manual',
                'date': log['timestamp'].date().isoformat() if log['timestamp'] else None,
                'time': log['timestamp'].time().isoformat() if log['timestamp'] else None
            }
            logs_list.append(log_entry)
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "logs": logs_list,
            "total": len(logs_list)
        })
        
    except Exception as e:
        print(f"Error getting logs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    """Delete a log entry by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM logs WHERE id = %s", (log_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Log entry not found"}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Log entry deleted successfully"
        })
        
    except Exception as e:
        print(f"Error deleting log: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/places', methods=['GET', 'POST'])
def places():
    """Get or add places"""
    try:
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("SELECT * FROM places ORDER BY name")
            places = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return jsonify({"success": True, "places": places})
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'lat', 'lon', 'geofence_radius']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if place already exists
            cursor.execute("SELECT id FROM places WHERE name = %s", (data['name'],))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": f"Place '{data['name']}' already exists"}), 400
            
            # Insert new place
            cursor.execute("""
                INSERT INTO places (id, name, lat, lon, geofence_radius, type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data['name'],  # Use name as ID
                data['name'],
                float(data['lat']),
                float(data['lon']),
                int(data['geofence_radius']),
                data.get('type', 'custom')
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            new_place = {
                "id": data['name'],
                "name": data['name'],
                "lat": float(data['lat']),
                "lon": float(data['lon']),
                "geofence_radius": int(data['geofence_radius']),
                "type": data.get('type', 'custom')
            }
            
            return jsonify({
                "success": True,
                "message": f"Place '{data['name']}' added successfully",
                "place": new_place
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/places/<place_id>', methods=['DELETE'])
def delete_place(place_id):
    """Delete a place"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM places WHERE id = %s", (place_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Place not found"}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": f"Place {place_id} deleted"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    """Get or add tasks"""
    try:
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            tasks = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return jsonify({"success": True, "tasks": tasks})
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Validate required fields
            if 'title' not in data:
                return jsonify({"error": "Missing required field: title"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Generate new ID
            new_id = f"task_{int(datetime.now(IST).timestamp())}"
            
            # Insert new task
            cursor.execute("""
                INSERT INTO tasks (id, title, description, status, created_at, priority, due_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                new_id,
                data['title'],
                data.get('description', ''),
                'pending',
                datetime.now(IST),
                data.get('priority', 'medium'),
                data.get('due_by')
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            new_task = {
                "id": new_id,
                "title": data['title'],
                "description": data.get('description', ''),
                "status": "pending",
                "created_at": datetime.now(IST).isoformat(),
                "completed_at": None,
                "priority": data.get('priority', 'medium')
            }
            
            return jsonify({
                "success": True,
                "message": f"Task '{data['title']}' added successfully",
                "task": new_task
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT', 'DELETE'])
def update_task(task_id):
    """Update or delete a task"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if request.method == 'PUT':
            data = request.get_json()
            
            # Build update query dynamically
            updates = []
            params = []
            
            if 'status' in data:
                updates.append("status = %s")
                params.append(data['status'])
                if data['status'] == 'completed':
                    updates.append("completed_at = %s")
                    params.append(datetime.now(IST))
                else:
                    updates.append("completed_at = %s")
                    params.append(None)
            
            if 'title' in data:
                updates.append("title = %s")
                params.append(data['title'])
            
            if 'description' in data:
                updates.append("description = %s")
                params.append(data['description'])
            
            if 'priority' in data:
                updates.append("priority = %s")
                params.append(data['priority'])
            
            if updates:
                params.append(task_id)
                cursor.execute(f"""
                    UPDATE tasks 
                    SET {', '.join(updates)}
                    WHERE id = %s
                """, params)
                
                if cursor.rowcount == 0:
                    cursor.close()
                    conn.close()
                    return jsonify({"error": "Task not found"}), 404
                
                conn.commit()
                cursor.close()
                conn.close()
            
                return jsonify({"success": True, "message": f"Task {task_id} updated"})
            else:
                cursor.close()
                conn.close()
                return jsonify({"error": "No fields to update"}), 400
        
        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
            
            if cursor.rowcount == 0:
                cursor.close()
                conn.close()
                return jsonify({"error": "Task not found"}), 404
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({"success": True, "message": f"Task {task_id} deleted"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calculate metrics
        cursor.execute("SELECT COUNT(*) FROM logs")
        total_logs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM logs WHERE DATE(timestamp) = CURRENT_DATE")
        today_logs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT event) FROM logs")
        unique_events = cursor.fetchone()[0]
        
        cursor.execute("SELECT COALESCE(SUM(duration_minutes), 0) FROM logs")
        total_duration = cursor.fetchone()[0]
        
        # Event distribution
        cursor.execute("SELECT event, COUNT(*) FROM logs GROUP BY event")
        event_counts = dict(cursor.fetchall())
        
        # Place distribution
        cursor.execute("""
            SELECT COALESCE(p.name, 'unknown'), COUNT(*) 
            FROM logs l 
            LEFT JOIN places p ON l.place_id = p.id 
            GROUP BY p.name
        """)
        place_counts = dict(cursor.fetchall())
        
        # Task stats
        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_tasks = cursor.fetchone()[0]
        
        cursor.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status")
        task_status_counts = dict(cursor.fetchall())
        
        task_stats = {
            "total": total_tasks,
            "pending": task_status_counts.get('pending', 0),
            "in_progress": task_status_counts.get('in_progress', 0),
            "completed": task_status_counts.get('completed', 0)
        }
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "metrics": {
                "total_logs": total_logs,
                "today_logs": today_logs,
                "unique_events": unique_events,
                "total_duration_hours": total_duration / 60
            },
            "event_distribution": event_counts,
            "place_distribution": place_counts,
            "task_stats": task_stats
        })
        
        
    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export data as CSV"""
    try:
        format_type = request.args.get('format', 'csv')
        export_type = request.args.get('type', 'logs')  # logs, combined, places, tasks, events
        
        if format_type == 'csv':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            if export_type == 'logs':
                cursor.execute("""
                    SELECT l.*, p.name as place_name
                    FROM logs l
                    LEFT JOIN places p ON l.place_id = p.id
                    ORDER BY l.timestamp DESC
                """)
                data = cursor.fetchall()
                
                # Create CSV in memory
                output = io.StringIO()
                if data:
                    # Write header
                    fieldnames = ['timestamp', 'event', 'lat', 'lon', 'place', 'notes', 'duration_minutes', 'mode']
                    output.write(','.join(fieldnames) + '\n')
                    
                    # Write data
                    for log in data:
                        row = [
                            log['timestamp'].isoformat() if log['timestamp'] else '',
                            log['event'],
                            str(log['lat']),
                            str(log['lon']),
                            log['place_name'] if log['place_name'] else 'unknown',
                            log['notes'] if log['notes'] else '',
                            str(log['duration_minutes']) if log['duration_minutes'] else '0',
                            log['mode'] if log['mode'] else 'Manual'
                        ]
                        output.write(','.join(row) + '\n')
                
                filename = f'work_logs_{datetime.now(IST).strftime("%Y%m%d_%H%M%S")}.csv'
                
            elif export_type == 'places':
                cursor.execute("SELECT * FROM places ORDER BY name")
                data = cursor.fetchall()
                
                output = io.StringIO()
                if data:
                    fieldnames = ['id', 'name', 'lat', 'lon', 'geofence_radius', 'type']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for place in data:
                        row = [
                            place['id'],
                            place['name'],
                            str(place['lat']),
                            str(place['lon']),
                            str(place['geofence_radius']) if place['geofence_radius'] else '0',
                            place['type'] if place['type'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                filename = f'work_places_{datetime.now(IST).strftime("%Y%m%d_%H%M%S")}.csv'
                
            elif export_type == 'tasks':
                cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
                data = cursor.fetchall()
                
                output = io.StringIO()
                if data:
                    fieldnames = ['id', 'title', 'description', 'status', 'created_at', 'completed_at', 'priority', 'due_by']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for task in data:
                        row = [
                            task['id'],
                            task['title'],
                            task['description'] if task['description'] else '',
                            task['status'],
                            task['created_at'].isoformat() if task['created_at'] else '',
                            task['completed_at'].isoformat() if task['completed_at'] else '',
                            task['priority'] if task['priority'] else '',
                            task['due_by'].isoformat() if task['due_by'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                filename = f'work_tasks_{datetime.now(IST).strftime("%Y%m%d_%H%M%S")}.csv'
                
            elif export_type == 'events':
                cursor.execute("SELECT * FROM events ORDER BY date DESC")
                data = cursor.fetchall()
                
                output = io.StringIO()
                if data:
                    fieldnames = ['id', 'title', 'description', 'date']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for event in data:
                        row = [
                            event['id'],
                            event['title'],
                            event['description'] if event['description'] else '',
                            event['date'].isoformat() if event['date'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                filename = f'work_events_{datetime.now(IST).strftime("%Y%m%d_%H%M%S")}.csv'
                
            elif export_type == 'combined':
                # Export all data in a single CSV with multiple sheets/sections
                output = io.StringIO()
                
                # Section 1: Logs
                cursor.execute("""
                    SELECT l.*, p.name as place_name
                    FROM logs l
                    LEFT JOIN places p ON l.place_id = p.id
                    ORDER BY l.timestamp DESC
                """)
                logs = cursor.fetchall()
                
                output.write('=== LOGS ===\n')
                if logs:
                    fieldnames = ['timestamp', 'event', 'lat', 'lon', 'place', 'notes', 'duration_minutes', 'mode']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for log in logs:
                        row = [
                            log['timestamp'].isoformat() if log['timestamp'] else '',
                            log['event'],
                            str(log['lat']),
                            str(log['lon']),
                            log['place_name'] if log['place_name'] else 'unknown',
                            log['notes'] if log['notes'] else '',
                            str(log['duration_minutes']) if log['duration_minutes'] else '0',
                            log['mode'] if log['mode'] else 'Manual'
                        ]
                        output.write(','.join(row) + '\n')
                
                output.write('\n=== PLACES ===\n')
                cursor.execute("SELECT * FROM places ORDER BY name")
                places = cursor.fetchall()
                
                if places:
                    fieldnames = ['id', 'name', 'lat', 'lon', 'geofence_radius', 'type']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for place in places:
                        row = [
                            place['id'],
                            place['name'],
                            str(place['lat']),
                            str(place['lon']),
                            str(place['geofence_radius']) if place['geofence_radius'] else '0',
                            place['type'] if place['type'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                output.write('\n=== TASKS ===\n')
                cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
                tasks = cursor.fetchall()
                
                if tasks:
                    fieldnames = ['id', 'title', 'description', 'status', 'created_at', 'completed_at', 'priority', 'due_by']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for task in tasks:
                        row = [
                            task['id'],
                            task['title'],
                            task['description'] if task['description'] else '',
                            task['status'],
                            task['created_at'].isoformat() if task['created_at'] else '',
                            task['completed_at'].isoformat() if task['completed_at'] else '',
                            task['priority'] if task['priority'] else '',
                            task['due_by'].isoformat() if task['due_by'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                output.write('\n=== EVENTS ===\n')
                cursor.execute("SELECT * FROM events ORDER BY date DESC")
                events = cursor.fetchall()
                
                if events:
                    fieldnames = ['id', 'title', 'description', 'date']
                    output.write(','.join(fieldnames) + '\n')
                    
                    for event in events:
                        row = [
                            event['id'],
                            event['title'],
                            event['description'] if event['description'] else '',
                            event['date'].isoformat() if event['date'] else ''
                        ]
                        output.write(','.join(row) + '\n')
                
                filename = f'worklog_combined_{datetime.now(IST).strftime("%Y%m%d_%H%M%S")}.csv'
            
            else:
                cursor.close()
                conn.close()
                return jsonify({"error": "Invalid export type. Use: logs, places, tasks, events, or combined"}), 400
            
            cursor.close()
            conn.close()
            
            # Create file-like object for Flask
            output.seek(0)
            csv_data = io.BytesIO()
            csv_data.write(output.getvalue().encode('utf-8'))
            csv_data.seek(0)
            
            return send_file(
                csv_data,
                as_attachment=True,
                download_name=filename,
                mimetype='text/csv'
            )
        else:
            return jsonify({"error": "Unsupported format"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/events', methods=['GET', 'POST'])
def events():
    """Get or add events (journal entries)"""
    try:
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("SELECT * FROM events ORDER BY date DESC")
            events = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return jsonify({"success": True, "events": events})
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['title', 'description', 'date']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Generate new ID
            new_id = f"event_{int(datetime.now(IST).timestamp())}"
            
            # Insert new event
            cursor.execute("""
                INSERT INTO events (id, title, description, date)
                VALUES (%s, %s, %s, %s)
            """, (
                new_id,
                data['title'],
                data['description'],
                data['date']
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            new_event = {
                "id": new_id,
                "title": data['title'],
                "description": data['description'],
                "date": data['date']
            }
            
            return jsonify({
                "success": True,
                "message": f"Event '{data['title']}' added successfully",
                "event": new_event
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/events/<event_id>', methods=['PUT', 'DELETE'])
def update_event(event_id):
    """Update or delete an event"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if request.method == 'PUT':
            data = request.get_json()
            
            # Build update query dynamically
            updates = []
            params = []
            
            if 'title' in data:
                updates.append("title = %s")
                params.append(data['title'])
            
            if 'description' in data:
                updates.append("description = %s")
                params.append(data['description'])
            
            if 'date' in data:
                updates.append("date = %s")
                params.append(data['date'])
            
            if updates:
                params.append(event_id)
                cursor.execute(f"""
                    UPDATE events 
                    SET {', '.join(updates)}
                    WHERE id = %s
                """, params)
                
                if cursor.rowcount == 0:
                    cursor.close()
                    conn.close()
                    return jsonify({"error": "Event not found"}), 404
                
                conn.commit()
                cursor.close()
                conn.close()
            
                return jsonify({"success": True, "message": f"Event {event_id} updated"})
            else:
                cursor.close()
                conn.close()
                return jsonify({"error": "No fields to update"}), 400
        
        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
            
            if cursor.rowcount == 0:
                cursor.close()
                conn.close()
                return jsonify({"error": "Event not found"}), 404
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({"success": True, "message": f"Event {event_id} deleted"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    
    port = int(os.environ.get('PORT', 5051))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=False, host='0.0.0.0', port=port, use_reloader=False)