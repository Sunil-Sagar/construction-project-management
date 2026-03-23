import { format } from 'date-fns';

export const formatCurrency = (amount) => {
  // Handle undefined, null, or NaN values
  const value = amount ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString, formatString = 'dd/MM/yyyy') => {
  if (!dateString) return '-';
  return format(new Date(dateString), formatString);
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

export const getWeekBoundaries = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  return {
    startDate: formatDateForInput(sunday),
    endDate: formatDateForInput(saturday)
  };
};

export const getDayOfWeek = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateString).getDay()];
};

export const isToday = (dateString) => {
  const today = new Date();
  const compareDate = new Date(dateString);
  return today.toDateString() === compareDate.toDateString();
};

export const getToday = () => {
  return formatDateForInput(new Date());
};
