export const validatePhone = (phone: string): boolean => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check if starts with +251 and has 9 digits after
  const ethiopiaRegex = /^\+251\d{9}$/;
  
  // Check if starts with 09 and has 8 digits after (convert to +251 format)
  const localRegex = /^09\d{8}$/;
  
  return ethiopiaRegex.test(cleaned) || localRegex.test(cleaned);
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Convert local format to international
  if (cleaned.startsWith('09')) {
    return '+251' + cleaned.substring(1);
  }
  
  return cleaned;
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};