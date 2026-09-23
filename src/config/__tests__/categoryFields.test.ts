import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, CATEGORY_LABELS, SERVICE_CATEGORIES } from '../../api/client';
import { CATEGORY_PROFILE_FIELDS, showsField } from '../categoryFields';

describe('categoryFields', () => {
  it('has a form, a name and a description prompt for every category', () => {
    for (const category of SERVICE_CATEGORIES) {
      expect(CATEGORY_PROFILE_FIELDS[category].bioPlaceholder).toBeTruthy();
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it('asks only a walker for the parks it walks in', () => {
    expect(showsField('walker', 'walkingSpots')).toBe(true);
    for (const category of SERVICE_CATEGORIES.filter((c) => c !== 'walker')) {
      expect(showsField(category, 'walkingSpots')).toBe(false);
    }
  });

  it('gives every booking status a Spanish label', () => {
    for (const status of BOOKING_STATUSES) {
      expect(BOOKING_STATUS_LABELS[status]).toMatch(/^[A-ZÁÉÍÓÚ]/);
    }
  });
});
