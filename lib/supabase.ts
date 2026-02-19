import { createClient } from '@supabase/supabase-js'

// Estas líneas leen las llaves de tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Aquí creamos la conexión oficial para CARRIZO Comex
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
