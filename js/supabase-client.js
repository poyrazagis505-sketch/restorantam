// =========================================================
// SUPABASE BAĞLANTI AYARLARI
// Bu bilgiler "public/anon" nitelikte olduğu için burada
// tutulmaları güvenlidir. Gerçek güvenlik veritabanındaki
// Row Level Security (RLS) kuralları ile sağlanıyor.
// =========================================================

const SUPABASE_URL = 'https://mmsetmzeraaspgrtmfsj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_608yDJFI2u6My9WUoZGJPw_zyFdZH5V';

// Bu dosyanın çalışması için HTML dosyasında, bu script'ten
// ÖNCE şu satır olmalı:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Depolama (Storage) bucket adı - tüm sistemde bu isim kullanılacak
const STORAGE_BUCKET = 'menu-images';

// Bir dosyayı Storage'a yükleyip herkese açık URL'sini döndüren yardımcı fonksiyon.
// folder: örn. "RESTAURANT_ID/products" veya "RESTAURANT_ID/logo"
async function uploadImageToStorage(file, folder) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
