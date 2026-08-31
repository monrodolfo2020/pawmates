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

// `id` is a real (fixed, made-up) UUID, not a display label — it's sent
// to the backend as-is as the booking's providerServiceId (see
// FakeMarketplaceAdapter's comment: no real Marketplace/provider
// directory exists yet, so this MVP has no real walker accounts behind
// these three — but each needs a genuinely distinct, validly-shaped id
// so their schedules don't collide with each other's bookings).
export const walkers: Walker[] = [
  { id: '143abd6b-2d8c-4578-ac4b-e0708b283adb', name: 'Camila Rodríguez', distance: '1.2 km', price: '$18/paseo', rating: '4.9', badge: 'Seguro incluido' },
  { id: '8446e6fc-5914-40e9-970a-175893843a29', name: 'Diego Martínez', distance: '2.0 km', price: '$15/paseo', rating: '4.8', badge: 'Cert. primeros auxilios' },
  { id: 'e91e60a3-59b3-4074-93da-22ea72a30843', name: 'Ana Torres', distance: '2.4 km', price: '$20/paseo', rating: '5.0', badge: 'Identidad verificada' },
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

export const BASE_PRICE = 57.2;
