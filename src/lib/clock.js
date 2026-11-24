/** 24-hour HH:MM for message and step timestamps. */
export const clock = (date = new Date()) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
