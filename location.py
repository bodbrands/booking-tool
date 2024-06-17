#!/Users/marketing/Documents/mbbooker/booker/bin python3

import requests

# API endpoint URL
url = "https://api.mindbodyonline.com/public/v6/site/sessiontypes"

# Headers including the API Key for authentication
headers = {
	'Api-Key': 'a8bdf3269776488498ccbfe948747706',
	'SiteId': '5736561',
}

# Make the GET request
response = requests.get(url, headers=headers)

# Check if the request was successful
if response.status_code == 200:
	# Parse the JSON response
	data = response.json()
	print(data)
else:
	print("Failed to retrieve data:", response.status_code)
	