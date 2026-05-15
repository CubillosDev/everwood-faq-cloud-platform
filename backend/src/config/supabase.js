const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan SUPABASE_URL y una clave de Supabase en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
