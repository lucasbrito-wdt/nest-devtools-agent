/**
 * Utilitários para sanitização de payloads
 */

const REDACTED_VALUE = '[REDACTED]';

/**
 * Sanitiza um objeto removendo campos sensíveis
 */
export function sanitizePayload(
  payload: any,
  sensitiveFields: string[],
): any {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, sensitiveFields));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(payload)) {
    // Verifica se é campo sensível (case-insensitive)
    const isSensitive = sensitiveFields.some(
      (field) => key.toLowerCase().includes(field.toLowerCase()),
    );

    if (isSensitive) {
      sanitized[key] = REDACTED_VALUE;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Trunca payload para não exceder tamanho máximo
 */
export function truncatePayload(payload: any, maxSize: number): any {
  const stringified = JSON.stringify(payload);

  if (stringified.length <= maxSize) {
    return payload;
  }

  // Se exceder, tenta truncar string
  const truncated = stringified.slice(0, maxSize);

  try {
    // Tenta parsear de volta (pode falhar se cortar no meio de um JSON)
    return JSON.parse(truncated + '...');
  } catch {
    // Se falhar, retorna string truncada
    return `${truncated}... [TRUNCATED]`;
  }
}

/**
 * Redacta valores que parecem ser sensíveis (heurística)
 */
export function redactSensitiveValues(value: string): string {
  // Redacta tokens JWT
  if (/^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
    return '[JWT_TOKEN]';
  }

  // Redacta API keys (formato comum: 32+ caracteres alfanuméricos)
  if (/^[a-zA-Z0-9_-]{32,}$/.test(value)) {
    return '[API_KEY]';
  }

  // Redacta possíveis credit cards
  if (/^\d{13,19}$/.test(value.replace(/\s/g, ''))) {
    return '[CREDIT_CARD]';
  }

  // Redacta hashes
  if (/^[a-f0-9]{32,}$/.test(value)) {
    return '[HASH]';
  }

  return value;
}

