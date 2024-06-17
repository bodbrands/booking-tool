# config.py

# Base URL for the MINDBODY API
BASE_URL = 'https://api.mindbodyonline.com/public/v6/'

# Configuration dictionary to hold API keys, site IDs, and session type IDs for each location
locations_config = {
    'winter_park': {
        'site_id': '5721018',
        'location_id': '1',
        'api_key': 'a8bdf3269776488498ccbfe948747706',
        'username': 'jim@bodenvy.com',
        'password': 'Bod2021#',
        'allowed_staff_ids': [100000025, 100000120, 100000138],
        'timezone': 'America/New_York',
        'sessionTypeProgram': '3',
        'sessionTypeIds': {'Consultation CoolSculpting': '6', 'Consultation Fat Reduction': '33', 'Consultation Cellulite': '35', 'Consultation Muscle Tone': '36', 'Consultation Weight Loss': '37', 'Consultation Extreme Transformation': '111', 'Consultation - Multiple Services': '138'}
    },
    'dr_phillips': {
        'site_id': '5721018',
        'location_id': '2',
        'api_key': 'a8bdf3269776488498ccbfe948747706',
        'username': 'jim@bodenvy.com',
        'password': 'Bod2021#',
        'allowed_staff_ids': [100000025, 100000120, 100000138],
        'timezone': 'America/New_York',
        'sessionTypeProgram': '3',
        'sessionTypeIds': {'Consultation CoolSculpting': '6', 'Consultation Fat Reduction': '33', 'Consultation Cellulite': '35', 'Consultation Muscle Tone': '36', 'Consultation Weight Loss': '37', 'Consultation Extreme Transformation': '111', 'Consultation - Multiple Services': '138'}
    },
    'tulsa': {
        'site_id': '5728185',
        'location_id': '1',
        'api_key': 'a8bdf3269776488498ccbfe948747706',
        'username': 'jim@bodenvy.com',
        'password': 'Bod2021#',
        'allowed_staff_ids': [100000002],
        'timezone': 'America/Chicago',
        'sessionTypeProgram': '4',
        'sessionTypeIds': {'Cellulite Consultation': '10', 'CoolSculpting Consultation': '11', 'Extreme Transformation Consultation': '12', 'Fat Reduction Consultation': '13', 'Muscle Tone Consultation': '14', 'Skin Tightening Consultation': '15', 'Consultation - Multiple Services': '16', 'Weight Loss Consultation': '50'}
    },
    'summit': {
        'site_id': '5736561',
        'location_id': '1',
        'api_key': 'a8bdf3269776488498ccbfe948747706',
        'username': 'summitnj@bodenvy.com',
        'password': 'Bod2021#',
        'allowed_staff_ids': [100000018, 100000036],
        'timezone': 'America/New_York',
        'sessionTypeProgram': '4',
        'sessionTypeIds': {'CoolSculpting Consultation': '10', 'Fat Reduction Consultation': '11', 'Muscle Tone Consultation': '12', 'Weight Loss Consultation': '13', 'Extreme Transformation Consultation': '14'}
    }
}
