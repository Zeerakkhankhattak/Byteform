import fs from 'fs';
import path from 'path';

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
}

function getSupabaseKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '').trim();
}

function ensureEnvLoaded() {
  if (getSupabaseUrl() && getSupabaseKey()) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {}
}

let cachedClient = null;
let supabaseJsModule = null;
let supabaseJsAttempted = false;

async function getSupabaseJsCreateClient() {
  if (supabaseJsAttempted) return supabaseJsModule;
  supabaseJsAttempted = true;
  try {
    const mod = await import('@supabase/supabase-js');
    supabaseJsModule = mod.createClient || mod.default?.createClient;
  } catch (e) {
    console.warn('Could not load @supabase/supabase-js module, falling back to native PostgREST HTTP client:', e.message);
    supabaseJsModule = null;
  }
  return supabaseJsModule;
}

// Built-in zero-dependency PostgREST client using Node 18+ global fetch
function createRestSupabaseClient(supabaseUrl, serviceKey) {
  const baseRestUrl = supabaseUrl.replace(/\/+$/, '') + '/rest/v1';
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };

  return {
    from(table) {
      return {
        select(columns = '*') {
          let selectCols = columns;
          let orderClause = '';
          let filterField = null;
          let filterVal = null;

          const queryObj = {
            order(col, { ascending = true } = {}) {
              orderClause = `order=${col}.${ascending ? 'asc' : 'desc'}`;
              return queryObj;
            },
            eq(field, val) {
              filterField = field;
              filterVal = val;
              return queryObj;
            },
            async maybeSingle() {
              let url = `${baseRestUrl}/${table}?select=${selectCols}&limit=1`;
              if (filterField) url += `&${filterField}=eq.${encodeURIComponent(filterVal)}`;
              try {
                const res = await fetch(url, { headers });
                if (!res.ok) {
                  const errText = await res.text();
                  return { data: null, error: { message: errText, code: String(res.status) } };
                }
                const data = await res.json();
                return { data: Array.isArray(data) && data.length > 0 ? data[0] : null, error: null };
              } catch (e) {
                return { data: null, error: { message: e.message } };
              }
            },
            async single() {
              return queryObj.maybeSingle();
            },
            then(resolve, reject) {
              let url = `${baseRestUrl}/${table}?select=${selectCols}`;
              if (orderClause) url += `&${orderClause}`;
              if (filterField) url += `&${filterField}=eq.${encodeURIComponent(filterVal)}`;
              fetch(url, { headers })
                .then(async res => {
                  if (!res.ok) {
                    const errText = await res.text();
                    resolve({ data: null, error: { message: errText, code: String(res.status) } });
                  } else {
                    const data = await res.json();
                    resolve({ data, error: null });
                  }
                })
                .catch(err => resolve({ data: null, error: { message: err.message } }));
            }
          };
          return queryObj;
        },
        insert(records) {
          return {
            select() {
              return {
                async single() {
                  try {
                    const res = await fetch(`${baseRestUrl}/${table}`, {
                      method: 'POST',
                      headers: { ...headers, 'Prefer': 'return=representation' },
                      body: JSON.stringify(records)
                    });
                    if (!res.ok) {
                      const errText = await res.text();
                      return { data: null, error: { message: errText, code: String(res.status) } };
                    }
                    const data = await res.json();
                    return { data: Array.isArray(data) ? data[0] : data, error: null };
                  } catch (e) {
                    return { data: null, error: { message: e.message } };
                  }
                }
              };
            }
          };
        },
        update(updates) {
          let filterField = null;
          let filterVal = null;
          return {
            eq(field, val) {
              filterField = field;
              filterVal = val;
              return {
                select() {
                  return {
                    async single() {
                      try {
                        const url = `${baseRestUrl}/${table}?${filterField}=eq.${encodeURIComponent(filterVal)}`;
                        const res = await fetch(url, {
                          method: 'PATCH',
                          headers: { ...headers, 'Prefer': 'return=representation' },
                          body: JSON.stringify(updates)
                        });
                        if (!res.ok) {
                          const errText = await res.text();
                          return { data: null, error: { message: errText, code: String(res.status) } };
                        }
                        const data = await res.json();
                        return { data: Array.isArray(data) ? data[0] : data, error: null };
                      } catch (e) {
                        return { data: null, error: { message: e.message } };
                      }
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

export async function getSupabaseAdminAsync() {
  if (cachedClient) return cachedClient;

  ensureEnvLoaded();

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY / SUPABASE_KEY)');
    throw new Error(`Missing required Supabase environment variables: ${missing.join(', ')}. Please check your Vercel Project Settings > Environment Variables or local .env file.`);
  }

  const createClientFn = await getSupabaseJsCreateClient();
  if (createClientFn) {
    try {
      cachedClient = createClientFn(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      return cachedClient;
    } catch (clientErr) {
      console.warn('createClient failed, falling back to PostgREST HTTP client:', clientErr);
    }
  }

  cachedClient = createRestSupabaseClient(supabaseUrl, supabaseServiceKey);
  return cachedClient;
}

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  ensureEnvLoaded();

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY / SUPABASE_KEY)');
    throw new Error(`Missing required Supabase environment variables: ${missing.join(', ')}. Please check your Vercel Project Settings > Environment Variables or local .env file.`);
  }

  // Fallback direct REST client works synchronously
  cachedClient = createRestSupabaseClient(supabaseUrl, supabaseServiceKey);
  return cachedClient;
}

export function isSupabaseConfigured() {
  ensureEnvLoaded();
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}
