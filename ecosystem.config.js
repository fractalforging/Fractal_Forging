'use strict';

module.exports = {
    apps: [
      {
        name: "Break-Tracker",
        script: "./app.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "production",
        },
        restart_delay: 3000, 
        max_restarts: 10,
      },
    ],
  };