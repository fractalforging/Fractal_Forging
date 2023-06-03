import https from 'https';

// Configuration section
const config = {
  startHour: 7,
  endHour: 23,
  minInterval: 5,
  maxInterval: 15,
  hostname: 'break-tracker-askit-pr-21.onrender.com',
  timeZone: 'Europe/Warsaw'
};

console.log("Script has started");

function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: config.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const sendRequest = (interval) => {
  const options = {
    hostname: config.hostname,
    path: '/',
    method: 'GET'
  };

  const req = https.request(options, res => {
    console.log(`[${formatter.format(new Date())}] statusCode: ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`[${formatter.format(new Date())}] Page touched successfully. Random interval: ${(interval / (60 * 1000)).toFixed(2)} minutes`);
    } else {
      console.error(`[${formatter.format(new Date())}] The server responded with a non-successful status code: ${res.statusCode}`);
    }
  });

  req.on('error', error => {
    console.error(`[${formatter.format(new Date())}] An error occurred while sending the request: ${error.message}`);
  });

  req.end();
};

const scheduleNextRequest = () => {
  const interval = getRandomInterval(config.minInterval * 60 * 1000, config.maxInterval * 60 * 1000);
  console.log(`[${formatter.format(new Date())}] Scheduling next request in ${(interval / (60 * 1000)).toFixed(2)} minutes.`);
  setTimeout(() => {
    try {
      const currentDate = new Date();
      const localHour = currentDate.getHours();
      const localDay = currentDate.getDate();
      const localWeekday = currentDate.getDay();

      // Log the local time, local hour, and local weekday for debugging purposes
      console.log(`[${formatter.format(new Date())}] Local Time: ${formatter.format(currentDate)}, Local Hour: ${localHour}, Local Weekday: ${localWeekday}`);

      // Check if it's a weekday (1 for Monday, 7 for Sunday) and within the desired hours
      if (localWeekday >= 1 && localWeekday <= 5 && localHour >= config.startHour && localHour < config.endHour) {
        sendRequest(interval);
      } else {
        console.log(`[${formatter.format(new Date())}] Skipping request because it's outside the desired schedule.`);
      }
    } catch (error) {
      console.error(`[${formatter.format(new Date())}] An error occurred in the keep alive script:`, error);
    }

    scheduleNextRequest();
  }, interval);
};

// Start the loop
scheduleNextRequest();
