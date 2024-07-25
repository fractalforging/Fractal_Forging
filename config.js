export default {
    breakTime: {
      totalMinutes: 30,
      resetTime: {
        hour: 22,
        minute: 0o0
      },
      environment: 'production', // 'production' or 'development'
      developmentOverride: {
        enabled: false,
        resetIntervalMinutes: 5
      }
    }
  };