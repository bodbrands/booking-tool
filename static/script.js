const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
const monthAndYear = document.getElementById("monthAndYear");

const appointmentTypes = {
    'winter_park': [
        { value: '138', text: 'Consultation - Multiple Services' },
        { value: '35', text: 'Consultation Cellulite' },
        { value: '6', text: 'Consultation CoolSculpting' },
        { value: '111', text: 'Consultation Extreme Transformation' },
        { value: '33', text: 'Consultation Fat Reduction' },
        { value: '37', text: 'Consultation Weight Loss' },
        { value: '36', text: 'Consultation Muscle Tone' }
    ],
    'dr_phillips': [
        { value: '138', text: 'Consultation - Multiple Services' },
        { value: '35', text: 'Consultation Cellulite' },
        { value: '6', text: 'Consultation CoolSculpting' },
        { value: '111', text: 'Consultation Extreme Transformation' },
        { value: '33', text: 'Consultation Fat Reduction' },
        { value: '37', text: 'Consultation Weight Loss' },
        { value: '36', text: 'Consultation Muscle Tone' }
    ],
    'tulsa': [
        { value: '10', text: 'Cellulite Consultation' },
        { value: '11', text: 'CoolSculpting Consultation' },
        { value: '12', text: 'Extreme Transformation Consultation' },
        { value: '13', text: 'Fat Reduction Consultation' },
        { value: '14', text: 'Muscle Tone Consultation' },
        { value: '16', text: 'Consultation - Multiple Services' },
        { value: '50', text: 'Weight Loss Consultation' }
    ],
    'summit': [
        { value: '10', text: 'CoolSculpting Consultation' },
        { value: '11', text: 'Fat Reduction Consultation' },
        { value: '12', text: 'Muscle Tone Consultation' },
        { value: '13', text: 'Weight Loss Consultation' },
        { value: '14', text: 'Extreme Transformation Consultation' }
    ]
};

const locationNames = {
    'winter_park': 'Winter Park',
    'dr_phillips': 'Dr. Phillips',
    'tulsa': 'Tulsa',
    'summit': 'Summit'
};

// Function to show a success message after booking
function showSuccessMessage() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <h2>Your consultation is confirmed!</h2>
        <p>You'll receive a confirmation email and text with your appointment details and our location address.</p>
        <p>Looking forward to seeing you soon!</p>
        <button onclick="closePopup()">Close</button>
    `;
    document.body.appendChild(popup);
}

document.addEventListener('DOMContentLoaded', function() {
    showCalendar(currentMonth, currentYear);
    
    document.getElementById('location').addEventListener('change', function() {
        const location = this.value;
        const appointmentTypeSelect = document.getElementById('appointmentType');
        appointmentTypeSelect.innerHTML = '<option value="" disabled selected>Select an appointment type</option>';
        
        if (appointmentTypes[location]) {
            appointmentTypes[location].forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.text;
                appointmentTypeSelect.appendChild(option);
            });
        }
    });
    
    document.getElementById('searchButton').addEventListener('click', function() {
        const appointmentType = document.getElementById('appointmentType').value;
        const location = document.getElementById('location').value;
        
        if (!location || !appointmentType) {
            alert('Please select both location and appointment type.');
            return;
        }
        
        displayLoadingMessage('Searching for available times...');
        
        fetch('/get_user_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: location }),
            credentials: 'include'  // Ensure cookies are sent
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error('Token not received');
            }
            
            const startDate = new Date(document.querySelector('.selected-day').textContent + ' ' + monthAndYear.textContent);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            fetchCombinedData(location, appointmentType, startDate, endDate);
        })
        .catch(error => {
            console.error('Error getting token:', error);
            hideLoadingMessage();
            alert('Failed to get token. Please try again.');
        });
    });
});

function highlightRange(startDate) {
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
    
    const tbl = document.getElementById("calendar-body");
    clearHighlights(tbl);
    
    let cells = Array.from(tbl.getElementsByTagName('td'));
    let startFound = false;
    let count = 0;
    
    cells.forEach(cell => {
        if (parseInt(cell.textContent) === startDate.getDate() && !startFound) {
            startFound = true;
            cell.classList.add("selected-day");
        }
        
        if (startFound && count < 7) {
            if (parseInt(cell.textContent) >= startDate.getDate()) {
                cell.classList.add("selected-range");
                count++;
            }
        }
    });
}

function fetchCombinedData(location, appointmentType, startDate, endDate) {
    if (!startDate || !endDate) {
        console.error('Start date or end date is undefined');
        return;
    }

    const correctedStartDate = new Date(startDate);
    correctedStartDate.setDate(startDate.getDate() + 1); // Correcting the start date

    fetch('/get_combined_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: location,
            sessionTypeId: appointmentType,
            startDate: correctedStartDate.toISOString(),
            endDate: endDate.toISOString(),
        }),
        credentials: 'include'  // Ensure cookies are sent
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        hideLoadingMessage();
        console.log('Combined data from backend:', data);
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format');
        }
        displayAvailableTimes(data, location);
    })
    .catch(error => {
        hideLoadingMessage();
        console.error('Error:', error);
        alert('Failed to fetch available times. Please try again.');
    });
}

function displayAvailableTimes(data, location) {
    const availabilityContainer = document.getElementById('availabilityContainer') || document.createElement('div');
    availabilityContainer.id = 'availabilityContainer';
    availabilityContainer.innerHTML = '';  // Clear previous results
    
    const locationHeader = document.createElement('h2');
    locationHeader.textContent = `Available times for ${locationNames[location]}`;
    availabilityContainer.appendChild(locationHeader);
    
    const groupedByDate = data.reduce((acc, curr) => {
        const date = new Date(curr.StartDateTime).toLocaleDateString();
        if (!acc[date]) acc[date] = {};
        if (!acc[date][curr.Staff.DisplayName]) acc[date][curr.Staff.DisplayName] = [];
        acc[date][curr.Staff.DisplayName].push(curr);
        return acc;
    }, {});
    
    Object.keys(groupedByDate).sort().forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date';
        dateDiv.innerHTML = `<h2>${date}</h2>`;
        availabilityContainer.appendChild(dateDiv);
        
        Object.keys(groupedByDate[date]).forEach(staff => {
            const staffDiv = document.createElement('div');
            staffDiv.className = 'staff';
            staffDiv.innerHTML = `<h3>${staff}</h3>`;
            const timesDiv = document.createElement('div');
            timesDiv.className = 'times';
            
            groupedByDate[date][staff].forEach(item => {
                const timeButton = document.createElement('button');
                timeButton.className = 'timeButton';
                timeButton.textContent = `${new Date(item.StartDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                timeButton.onclick = () => showBookingPopup(date, new Date(item.StartDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), item.Staff.DisplayName, item.Staff.Id);
                timesDiv.appendChild(timeButton);
            });
            
            staffDiv.appendChild(timesDiv);
            availabilityContainer.appendChild(staffDiv);
        });
    });
    
    document.body.appendChild(availabilityContainer);
    availabilityContainer.scrollIntoView({ behavior: 'smooth' });
}

function showBookingPopup(date, time, staffName, staffId) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <h2>Confirm Booking</h2>
        <p>Date: ${date}</p>
        <p>Time: ${time}</p>
        <p>Staff: ${staffName}</p>
        <label for="firstName">First Name:</label>
        <input type="text" id="firstName" name="firstName" required>
        <label for="lastName">Last Name:</label>
        <input type="text" id="lastName" name="lastName" required>
        <label for="email">Email:</label>
        <input type="text" id="email" name="email" required>
        <label for="phone">Phone Number:</label>
        <input type="text" id="phone" name="phone" required>
        <button onclick="bookAppointment('${date}', '${time}', '${staffId}')">Book Appointment</button>
        <button onclick="closePopup()">Close</button>
    `;
    document.body.appendChild(popup);
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) popup.remove();
}

function bookAppointment(date, time, staffId) {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const appointmentType = document.getElementById('appointmentType').value;
    
    displayLoadingMessage('Booking your appointment...');
    
    fetch('/book_appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: location,
            sessionTypeId: appointmentType,
            date: date,
            time: time,
            staffId: staffId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
        }),
        credentials: 'include'  // Ensure cookies are sent
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        hideLoadingMessage();
        if (data.success) {
            showSuccessMessage();
        } else {
            alert(`Booking Failed: ${data.error}`);
        }
        closePopup();
    })
    .catch(error => {
        hideLoadingMessage();
        console.error('Error booking appointment:', error);
        alert(`Booking Failed: ${error.message}`);
    });
}

// Function to display a loading message
function displayLoadingMessage(message) {
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loadingMessage';
    loadingMessage.textContent = message;
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.backgroundColor = '#fff';
    loadingMessage.style.border = '1px solid #ccc';
    loadingMessage.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    loadingMessage.style.zIndex = '1000';
    document.body.appendChild(loadingMessage);
}

// Function to hide the loading message
function hideLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) loadingMessage.remove();
}

function showCalendar(month, year) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    monthAndYear.textContent = monthNames[month] + ' ' + year;
    
    const firstDay = (new Date(year, month)).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();
    
    const tbl = document.getElementById("calendar-body");
    tbl.innerHTML = "";
    
    let date = 1;
    let hasStarted = false;
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement("td");
            if (!hasStarted && j === firstDay) {
                hasStarted = true;
            }
            if (hasStarted && date <= daysInMonth) {
                let cellText = document.createTextNode(date);
                cell.appendChild(cellText);
                cell.onclick = (function(d, m, y) {
                    return function() {
                        highlightRange(new Date(y, m, d));
                        console.log("Date clicked:", new Date(y, m, d).toISOString().split('T')[0]);
                    }
                })(date, month, year);
                date++;
            } else {
                cell.appendChild(document.createTextNode(""));
            }
            row.appendChild(cell);
        }
        tbl.appendChild(row);
        if (date > daysInMonth) {
            break; // Stop creating rows if all dates are already placed
        }
    }
}

function moveMonth(step) {
    currentMonth += step;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
    }
    showCalendar(currentMonth, currentYear);
}

function clearHighlights(table) {
    const cells = table.getElementsByTagName('td');
    for (let cell of cells) {
        cell.classList.remove("selected-day", "selected-range");
    }
}
