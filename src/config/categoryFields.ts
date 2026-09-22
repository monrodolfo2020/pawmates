import { ServiceCategory } from '../api/client';

/**
 * What each kind of business is actually asked for.
 *
 * The profile started as a walker's profile, so everyone was asked for a
 * walking zone and the parks they use — a store or a vet filling that in
 * made no sense, and the form read as if it had been written for someone
 * else. The fields on the record are still shared; what changes here is
 * which ones a given category sees, and what each one is called.
 *
 * A field left out of a category is also **cleared on save** (see
 * ProviderProfileEditScreen), so a walker who becomes a vet doesn't keep
 * publishing "Parque México" on their page.
 */
export type ProfileFieldId =
  | 'serviceArea'
  | 'publicAddress'
  | 'specialty'
  | 'plansOffered'
  | 'walkingSpots'
  | 'hours';

export type FieldCopy = { label: string; placeholder: string; multiline?: boolean };

export type CategoryProfileConfig = {
  /** What the description field asks for — the answer differs a lot
   * between a paseador and a hotel. */
  bioPlaceholder: string;
  fields: Partial<Record<ProfileFieldId, FieldCopy>>;
};

const HOURS_ATTENTION: FieldCopy = {
  label: 'Horarios de atención',
  placeholder: 'Ej. Lun a Sáb de 9:00 a 20:00',
};

export const CATEGORY_PROFILE_FIELDS: Record<ServiceCategory, CategoryProfileConfig> = {
  walker: {
    bioPlaceholder: 'Cuéntale a los dueños cómo son tus paseos y por qué confiar en ti.',
    fields: {
      // A paseador has no storefront: a zone is the honest equivalent.
      serviceArea: { label: 'Zona donde paseas', placeholder: 'Ej. Roma Norte y Condesa, CDMX' },
      specialty: { label: 'Tu especialidad', placeholder: 'Ej. Perros grandes y energéticos' },
      plansOffered: {
        label: 'Tipos de paseo que ofreces',
        placeholder: 'Ej. Paseo individual 30 min, paseo grupal 1 h, plan semanal 3 veces',
        multiline: true,
      },
      walkingSpots: {
        label: 'Parques o sitios donde paseas',
        placeholder: 'Ej. Parque México, Bosque de Chapultepec',
      },
      hours: {
        label: 'Horarios en que paseas',
        placeholder: 'Ej. Lun a Vie de 7:00 a 11:00 y de 17:00 a 20:00',
      },
    },
  },

  vet: {
    bioPlaceholder: 'Cuéntale a los dueños qué atiende tu clínica y quién la atiende.',
    fields: {
      publicAddress: {
        label: 'Dirección de la clínica',
        placeholder: 'Ej. Av. Revolución 1200, San Ángel, CDMX',
      },
      specialty: {
        label: 'Especialidad',
        placeholder: 'Ej. Medicina felina, cirugía de tejidos blandos',
      },
      plansOffered: {
        label: 'Servicios que ofreces',
        placeholder: 'Ej. Consulta general, vacunación, esterilización, laboratorio, rayos X',
        multiline: true,
      },
      hours: {
        label: 'Horarios de atención',
        placeholder: 'Ej. Lun a Sáb de 9:00 a 20:00, urgencias 24 h',
      },
    },
  },

  grooming: {
    bioPlaceholder: 'Cuéntale a los dueños cómo trabajas y con qué productos.',
    fields: {
      publicAddress: {
        label: 'Dirección de la estética',
        placeholder: 'Ej. Av. Álvaro Obregón 120, Roma Norte, CDMX',
      },
      specialty: {
        label: 'Especialidad',
        placeholder: 'Ej. Corte de raza, perros de pelo largo',
      },
      plansOffered: {
        label: 'Servicios y precios',
        placeholder: 'Ej. Baño y secado $350, corte de raza $500, spa relajante $600',
        multiline: true,
      },
      hours: HOURS_ATTENTION,
    },
  },

  boarding: {
    bioPlaceholder: 'Cuéntale a los dueños cómo son tus instalaciones y la rutina de cada día.',
    fields: {
      publicAddress: {
        label: 'Dirección del hotel o guardería',
        placeholder: 'Ej. Camino a Santa Teresa 500, CDMX',
      },
      specialty: {
        label: 'Qué mascotas recibes',
        placeholder: 'Ej. Perros hasta 20 kg y gatos',
      },
      plansOffered: {
        label: 'Servicios y tarifas',
        placeholder: 'Ej. Hospedaje por noche $450, guardería de día $250, incluye 3 paseos',
        multiline: true,
      },
      hours: {
        label: 'Horarios de entrega y recepción',
        placeholder: 'Ej. Recepción de 8:00 a 20:00, todos los días',
      },
    },
  },

  training: {
    bioPlaceholder: 'Cuéntale a los dueños tu método y qué resultados puede esperar.',
    fields: {
      // A trainer may travel, have a fixed place, or both — so both.
      serviceArea: {
        label: 'Zona donde das clases',
        placeholder: 'Ej. Sur de CDMX, a domicilio',
      },
      publicAddress: {
        label: 'Dirección, si tienes un lugar fijo',
        placeholder: 'Ej. Parque Hundido, o tu escuela',
      },
      specialty: {
        label: 'Especialidad',
        placeholder: 'Ej. Obediencia básica, problemas de conducta',
      },
      plansOffered: {
        label: 'Programas que ofreces',
        placeholder: 'Ej. Curso de obediencia de 8 sesiones, evaluación inicial sin costo',
        multiline: true,
      },
      hours: { label: 'Horarios', placeholder: 'Ej. Lun a Sáb de 8:00 a 18:00' },
    },
  },

  other: {
    bioPlaceholder: 'Cuéntale a los dueños qué ofreces y por qué confiar en ti.',
    fields: {
      publicAddress: {
        label: 'Dirección, si atiendes en un lugar fijo',
        placeholder: 'Ej. Av. Insurgentes Sur 800, CDMX',
      },
      serviceArea: {
        label: 'Zona de servicio, si vas a domicilio',
        placeholder: 'Ej. Benito Juárez y Coyoacán, CDMX',
      },
      specialty: { label: 'Especialidad', placeholder: 'Ej. Transporte de mascotas' },
      plansOffered: {
        label: 'Servicios que ofreces',
        placeholder: 'Ej. Traslado a consulta, acompañamiento en viajes',
        multiline: true,
      },
      hours: HOURS_ATTENTION,
    },
  },
};

export function showsField(category: ServiceCategory, field: ProfileFieldId): boolean {
  return CATEGORY_PROFILE_FIELDS[category].fields[field] !== undefined;
}
