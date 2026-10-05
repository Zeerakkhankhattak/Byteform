import crypto from 'crypto';

const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters, no ambiguous chars (0, O, 1, I)

export function generateRandomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

export function generateCertificateId(startDate) {
  const prefix = process.env.CERT_ID_PREFIX || 'BF-INT-';
  let year = new Date().getFullYear();
  if (startDate) {
    const parsedYear = new Date(startDate).getFullYear();
    if (!isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100) {
      year = parsedYear;
    }
  }
  const randomSuffix = generateRandomCode(6);
  return `${prefix}${year}-${randomSuffix}`;
}

export async function generateUniqueCertificateId(supabase, startDate) {
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    const certId = generateCertificateId(startDate);
    const { data, error } = await supabase
      .from('certificates')
      .select('id')
      .eq('certificate_id', certId)
      .maybeSingle();

    if (error) {
      // If error occurs, still return the generated ID so creation can attempt insert with unique constraint
      return certId;
    }

    if (!data) {
      return certId; // Guaranteed unique
    }
  }
  return generateCertificateId(startDate);
}
