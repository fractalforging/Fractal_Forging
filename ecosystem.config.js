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
        // Customize the number of restart attempts
        restart_delay: 3000, // Delay between restart attempts (in milliseconds)
        max_restarts: 10, // Maximum number of restart attempts
      },
    ],
  };
  