export const sizeOptions = ['Pequeño', 'Mediano', 'Grande'];
export const temperamentOptions = ['Juguetón', 'Tranquilo', 'Sociable', 'Tímido', 'Enérgico'];
export const vaccineOptions = ['Rabia', 'Parvovirus', 'Moquillo', 'Bordetella'];
export const dayOptions = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const timeOptions = ['7:00 am', '8:00 am', '5:00 pm', '6:00 pm'];
export const tipOptions = [10, 15, 20, 25];
export const paymentOptions = ['Tarjeta •• 4482', 'PayPal', 'Apple Pay'];

export const requests = [
  { pet: 'Toby · Beagle', time: 'Hoy 4:00pm', detail: 'Paseo de 30 min, primera vez con este dueño.' },
  { pet: 'Luna · Border Collie', time: 'Mañana 8:00am', detail: 'Paseo recurrente, 3er paseo de la semana.' },
];

export const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => ({
  label, count: [2, 3, 1, 2, 2, 1, 1][i],
}));

// MXN (converted from the original $57.20 USD demo figure at ~17 MXN/USD).
export const BASE_PRICE = 972.4;
