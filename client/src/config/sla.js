export const SLA_CONFIG = {
    Low: {
      responseMinutes: 8 * 60,
      resolutionMinutes: 3 * 24 * 60,
    },
  
    Medium: {
      responseMinutes: 4 * 60,
      resolutionMinutes: 2 * 24 * 60,
    },
  
    High: {
      responseMinutes: 60,
      resolutionMinutes: 8 * 60,
    },
  
    Critical: {
      responseMinutes: 15,
      resolutionMinutes: 4 * 60,
    },
  };