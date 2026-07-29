export const sizeOptions = ['Pequeño', 'Mediano', 'Grande'];
export const temperamentOptions = ['Juguetón', 'Tranquilo', 'Sociable', 'Tímido', 'Enérgico'];
export const vaccineOptions = ['Rabia', 'Parvovirus', 'Moquillo', 'Bordetella'];
export const dayOptions = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const timeOptions = ['7:00 am', '8:00 am', '5:00 pm', '6:00 pm'];
export const tipOptions = [10, 15, 20, 25];
export const paymentOptions = ['Tarjeta •• 4482', 'PayPal', 'Apple Pay'];

export type Walker = {
  id: string;
  name: string;
  distance: string;
  price: string;
  rating: string;
  badge: string;
};

export const walkers: Walker[] = [
  { id: 'w1', name: 'Camila Rodríguez', distance: '1.2 km', price: '$18/paseo', rating: '4.9', badge: 'Seguro incluido' },
  { id: 'w2', name: 'Diego Martínez', distance: '2.0 km', price: '$15/paseo', rating: '4.8', badge: 'Cert. primeros auxilios' },
  { id: 'w3', name: 'Ana Torres', distance: '2.4 km', price: '$20/paseo', rating: '5.0', badge: 'Identidad verificada' },
];

export const reviews = [
  { name: 'Marta L.', rating: '5', text: 'Súper puntual y me mandó fotos durante todo el paseo.' },
  { name: 'Jorge P.', rating: '5', text: 'Mi perro la adora, siempre pregunta antes de cambiar la ruta.' },
];

export const requests = [
  { pet: 'Toby · Beagle', time: 'Hoy 4:00pm', detail: 'Paseo de 30 min, primera vez con este dueño.' },
  { pet: 'Luna · Border Collie', time: 'Mañana 8:00am', detail: 'Paseo recurrente, 3er paseo de la semana.' },
];

export const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => ({
  label, count: [2, 3, 1, 2, 2, 1, 1][i],
}));

export const liveLog = [
  { time: '14:02', text: 'Rocky tomó agua en el parque.', photo: true },
  { time: '14:08', text: 'Paseo tranquilo, sin otros perros cerca.', photo: false },
];

export const BASE_PRICE = 57.2;
