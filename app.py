from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
from config import locations_config, BASE_URL

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = 'Z6DwwuhT6pwMNrfSQVYlbKF-F8nyN3GttGRszjNfv_8'  # Change this to your actual secret key

# Serializer for generating and verifying tokens
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_user_token', methods=['POST'])
def get_user_token():
    data = request.json
    config = locations_config.get(data['location'])
    if not config:
        return jsonify({'error': 'Invalid location'}), 404

    url = f"{BASE_URL}usertoken/issue"
    body = {'Username': config['username'], 'Password': config['password']}
    headers = {'Api-Key': config['api_key'], 'SiteId': config['site_id'], 'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, json=body)
    if response.status_code == 200:
        token = response.json().get('AccessToken')
        # Generate a secure token
        secure_token = serializer.dumps(token)
        response = make_response(jsonify({'success': True}))
        response.set_cookie('access_token', secure_token, httponly=True, secure=True, samesite='None')
        return response
    else:
        return jsonify({'error': 'Failed to retrieve user token', 'status_code': response.status_code})

@app.route('/get_active_session_times', methods=['POST'])
def get_active_session_times():
    token = request.cookies.get('access_token')
    if not token:
        return jsonify({'error': 'Token not provided'}), 401
    try:
        token = serializer.loads(token)
    except:
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    config = locations_config.get(data['location'])
    if not config:
        return jsonify({'error': 'Invalid location'}), 404

    url = f"{BASE_URL}appointment/activesessiontimes"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id']}
    params = {
        'LocationId': config['location_id'],
        'SessionTypeIds': data['sessionTypeId'],
        'ScheduleType': 'Appointment',
    }
    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())


@app.route('/get_bookable_items', methods=['POST'])
def get_bookable_items():
    token = request.cookies.get('access_token')
    if not token:
        return jsonify({'error': 'Token not provided'}), 401
    try:
        token = serializer.loads(token)
    except:
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    config = locations_config.get(data['location'])
    if not config:
        return jsonify({'error': 'Invalid location'}), 404

    url = f"{BASE_URL}appointment/bookableitems"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id']}
    params = {
        'SessionTypeIds': [data['sessionTypeId']],
        'LocationId': config['location_id'],
        'StartDate': data['startDate'],
        'EndDate': data['endDate'],
        'ignore_default_session_length': 'false'
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

@app.route('/get_combined_data', methods=['POST'])
def get_combined_data():
    token = request.cookies.get('access_token')
    if not token:
        return jsonify({'error': 'Token not provided'}), 401
    try:
        token = serializer.loads(token)
    except:
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    active_session_times = get_active_session_times_from_api(token, data)
    bookable_items = get_bookable_items_from_api(token, data)
    combined_data = combine_active_times_with_bookable_items(active_session_times, bookable_items, data['location'])
    return jsonify(combined_data)

def get_active_session_times_from_api(token, data):
    config = locations_config.get(data['location'])
    url = f"{BASE_URL}appointment/activesessiontimes"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id']}
    params = {
        'LocationId': config['location_id'],
        'SessionTypeIds': data['sessionTypeId'],
        'ScheduleType': 'Appointment',
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

def get_bookable_items_from_api(token, data):
    config = locations_config.get(data['location'])
    url = f"{BASE_URL}appointment/bookableitems"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id']}
    params = {
        'SessionTypeIds': [data['sessionTypeId']],
        'LocationId': config['location_id'],
        'StartDate': data['startDate'],
        'EndDate': data['endDate'],
        'ignore_default_session_length': 'false'
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

def combine_active_times_with_bookable_items(active_session_times, bookable_items, location):
    combined_data = []
    availabilities = bookable_items.get('Availabilities', [])
    allowed_staff_ids = locations_config[location].get('allowed_staff_ids', [])
    location_id = locations_config[location].get('location_id')

    for item in availabilities:
        if item['Staff']['Id'] not in allowed_staff_ids:
            continue
        if str(item['Location']['Id']) != str(location_id):
            continue

        try:
            start_datetime = datetime.strptime(item['StartDateTime'], "%Y-%m-%dT%H:%M:%S%z")
            end_datetime = datetime.strptime(item['EndDateTime'], "%Y-%m-%dT%H:%M:%S%z")
        except ValueError as e:
            print(f"Error parsing date: {e}")
            continue
        
        active_times = active_session_times.get('ActiveSessionTimes', [])
        for active_time in active_times:
            try:
                active_time_obj = datetime.strptime(active_time, "%H:%M:%S").time()
                active_datetime = datetime.combine(start_datetime.date(), active_time_obj)
                
                if start_datetime.time() <= active_time_obj < end_datetime.time():
                    item_copy = item.copy()
                    item_copy['StartDateTime'] = active_datetime.isoformat()
                    combined_data.append(item_copy)
            except ValueError as e:
                print(f"Error parsing active time: {e}")
                continue

    return combined_data

@app.route('/book_appointment', methods=['POST'])
def book_appointment():
    token = request.cookies.get('access_token')
    if not token:
        return jsonify({'error': 'Token not provided'}), 401
    try:
        token = serializer.loads(token)
    except:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.json
    config = locations_config.get(data['location'])
    if not config:
        return jsonify({'error': 'Invalid location configuration'}), 404
    
    client_id = get_or_create_client(data, config, token)
    
    if not client_id:
        return jsonify({'error': 'Failed to get or create client'}), 400

    date_str = data['date']
    time_str = data['time']
    dt = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%Y %I:%M %p").isoformat()
    
    url = f"{BASE_URL}appointment/addappointment"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id'], 'Content-Type': 'application/json'}
    booking_data = {
        'SessionTypeId': data['sessionTypeId'],
        'LocationId': config['location_id'],
        'StaffId': data['staffId'],
        'StartDateTime': dt,
        'ClientId': client_id
    }
    
    print(f"Booking data being sent to Mindbody: {booking_data}")
    
    response = requests.post(url, headers=headers, json=booking_data)
    if response.status_code == 200:
        return jsonify({'success': True, 'data': response.json()})
    else:
        print(f"Booking failed with status code {response.status_code} and response {response.text}")
        if response.status_code == 400 and "The given time is not available for booking." in response.text:
            # Attempt to book with 15-minute duration
            booking_data['duration'] = 15  # Set the duration to 15 minutes
            response = requests.post(url, headers=headers, json=booking_data)
            if response.status_code == 200:
                return jsonify({'success': True, 'data': response.json()})
            else:
                print(f"15-minute booking also failed with status code {response.status_code} and response {response.text}")
                return jsonify({'success': False, 'error': response.text, 'status_code': response.status_code})
        else:
            return jsonify({'success': False, 'error': response.text, 'status_code': response.status_code})

def get_or_create_client(data, config, token):
    url = f"{BASE_URL}client/clients"
    headers = {'Authorization': f"Bearer {token}", 'Api-Key': config['api_key'], 'SiteId': config['site_id'], 'Content-Type': 'application/json'}
    search_data = {'SearchText': data['email']}
    
    response = requests.get(url, headers=headers, params=search_data)
    if response.status_code == 200:
        clients = response.json().get('Clients', [])
        if clients:
            return clients[0]['Id']
    else:
        print(f"Client search failed with status code {response.status_code} and response {response.text}")
    
    url = f"{BASE_URL}client/addclient"
    client_data = {
        'FirstName': data['firstName'],
        'LastName': data['lastName'],
        'Email': data['email'],
        'MobilePhone': data['phone']
    }
    
    response = requests.post(url, headers=headers, json=client_data)
    if response.status_code == 200:
        return response.json().get('Client', {}).get('Id')
    else:
        print(f"Client creation failed with status code {response.status_code} and response {response.text}")
        return None
        
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
    
