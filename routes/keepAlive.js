import https from 'https';

// Configuration section
const config = {
  startHour: 0,
  endHour: 0,
  minInterval: 5,
  maxInterval: 15,
  hostname: 'break-tracker-askit-pr-21.onrender.com',
  timeZone: 'Europe/Warsaw',
  includeWeekends: true
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

  setTimeout(() => {
    const currentDate = new Date();
    const localHour = currentDate.getUTCHours() + calculateTimezoneOffset(config.timeZone);

    // Correct the hours if it's over 24
    const correctedLocalHour = localHour >= 24 ? localHour - 24 : localHour;

    if (shouldSendRequest(correctedLocalHour, currentDate)) {
      sendRequest(interval);
    }

    scheduleNextRequest();
  }, interval);
};

const shouldSendRequest = (hour, currentDate) => {
  const isWeekend = currentDate.getUTCDay() === 0 || currentDate.getUTCDay() === 6;

  if (!config.includeWeekends && isWeekend) {
    return false;
  }

  if (hour >= config.startHour && (hour < config.endHour || config.startHour === config.endHour)) {
    return true;
  }

  return false;
};

const calculateTimezoneOffset = (timeZone) => {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timeZone }));
  const offset = (tzDate - utcDate) / 3600000;
  return offset;
};

// Start the loop
scheduleNextRequest();
