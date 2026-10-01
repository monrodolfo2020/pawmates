/** The explainer videos for businesses, in the order to watch them.
 * Vertical 720×1280, silent, captioned; see assets/videos. */
export type HowToVideo = {
  id: string;
  title: string;
  summary: string;
  /** "0:38" */
  length: string;
  source: number;
  poster: number;
};

export const HOW_TO_VIDEOS: HowToVideo[] = [
  {
    id: 'bienvenida',
    title: 'PET Conect@ para tu negocio',
    summary: 'Qué es PET Conect@ y cómo te ayuda a conseguir clientes.',
    length: '0:38',
    source: require('../../assets/videos/bienvenida.mp4'),
    poster: require('../../assets/videos/bienvenida.jpg'),
  },
  {
    id: 'registro',
    title: 'Registra tu negocio',
    summary: 'Los 3 pasos del registro y la revisión de tu negocio.',
    length: '0:36',
    source: require('../../assets/videos/registro.mp4'),
    poster: require('../../assets/videos/registro.jpg'),
  },
  {
    id: 'tu-pagina',
    title: 'Arma tu página',
    summary: 'Tus servicios, precios y fotos, y cómo compartir tu enlace y tu QR.',
    length: '0:38',
    source: require('../../assets/videos/tu-pagina.mp4'),
    poster: require('../../assets/videos/tu-pagina.jpg'),
  },
  {
    id: 'reservas',
    title: 'Recibe reservas',
    summary: 'Para paseadores: aceptar solicitudes y hacer el paseo en vivo.',
    length: '0:35',
    source: require('../../assets/videos/reservas.mp4'),
    poster: require('../../assets/videos/reservas.jpg'),
  },
  {
    id: 'resenas',
    title: 'Reseñas y huesitos',
    summary: 'Cómo te califican tus clientes y cómo subir en el directorio.',
    length: '0:38',
    source: require('../../assets/videos/resenas.mp4'),
    poster: require('../../assets/videos/resenas.jpg'),
  },
];
