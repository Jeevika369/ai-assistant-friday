const reminders = [];

export const productivityTools = {
  async create_reminder({ title, minutes }) {
    const timeMs = (minutes || 10) * 60 * 1000;
    const dueTime = new Date(Date.now() + timeMs).toLocaleTimeString();
    
    const reminder = {
      id: `rem_${Date.now()}`,
      title,
      dueTime,
      minutes
    };
    reminders.push(reminder);

    return {
      status: 'success',
      reminder,
      message: `Gotcha. Reminding you "${title}" in ${minutes} minutes (at ${dueTime}).`
    };
  },

  async list_reminders() {
    return {
      status: 'success',
      reminders,
      message: `You have ${reminders.length} active reminders.`
    };
  }
};
