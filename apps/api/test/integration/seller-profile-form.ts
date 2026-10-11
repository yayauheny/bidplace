/**
 * Builds the multipart form accepted by POST/PATCH /seller/profile: JSON
 * fields go into one `data` part (so an explicit `null` survives), the photo
 * goes into `profilePhoto`.
 */
export function sellerProfileForm(
  fields: Record<string, unknown>,
  photo?: Blob,
  fileName = 'profile.png',
): FormData {
  const form = new FormData();
  form.set('data', JSON.stringify(fields));
  if (photo) form.set('profilePhoto', photo, fileName);
  return form;
}
