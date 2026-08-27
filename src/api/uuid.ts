// RFC-4122 v4 UUID, Math.random-based — good enough for the placeholder
// petId/serviceTypeCode/addressId this demo sends (the backend doesn't
// validate them against a real Pets/Identity service), not for anything
// security-sensitive. Avoids adding a dependency for one string.
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
