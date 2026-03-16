// ── Flavor Passport · Supabase Configuration ──────────────────────────────
// 1. Go to https://app.supabase.com → create a new project
// 2. Project Settings → API → copy "Project URL" and "anon public" key below
// 3. Run the SQL in the Supabase SQL Editor (Settings → SQL Editor):
//
// -- PASTE AND RUN THIS SQL IN YOUR SUPABASE PROJECT:
//
// create table user_stamps (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade not null,
//   country text not null,
//   product_name text not null,
//   earned_at timestamptz default now(),
//   unique(user_id, country)
// );
// alter table user_stamps enable row level security;
// create policy "Users see own stamps" on user_stamps for select using (auth.uid() = user_id);
// create policy "Users insert own stamps" on user_stamps for insert with check (auth.uid() = user_id);
//
// create table community_posts (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade not null,
//   username text not null,
//   content text not null,
//   sauce_tag text,
//   image_url text,
//   created_at timestamptz default now()
// );
// alter table community_posts enable row level security;
// create policy "Anyone reads posts" on community_posts for select using (true);
// create policy "Auth users insert posts" on community_posts for insert with check (auth.uid() = user_id);
// create policy "Users delete own posts" on community_posts for delete using (auth.uid() = user_id);
//
// create table post_likes (
//   user_id uuid references auth.users(id) on delete cascade,
//   post_id uuid references community_posts(id) on delete cascade,
//   primary key (user_id, post_id)
// );
// alter table post_likes enable row level security;
// create policy "Anyone reads likes" on post_likes for select using (true);
// create policy "Auth users like" on post_likes for insert with check (auth.uid() = user_id);
// create policy "Users unlike" on post_likes for delete using (auth.uid() = user_id);

window.SUPABASE_URL      = 'YOUR_SUPABASE_PROJECT_URL';
window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Stamp claim codes (print these on product packaging / QR destinations)
window.STAMP_CODES = {
  'FP-JP-001': { country: 'Japan',    flag: '🇯🇵', product: 'Miso Yuzu Glaze' },
  'FP-MA-002': { country: 'Morocco',  flag: '🇲🇦', product: 'Harissa Chermoula' },
  'FP-PE-003': { country: 'Peru',     flag: '🇵🇪', product: 'Aji Amarillo Paste' },
  'FP-TH-004': { country: 'Thailand', flag: '🇹🇭', product: 'Nam Prik Pao' },
  'FP-ET-005': { country: 'Ethiopia', flag: '🇪🇹', product: 'Berbere Paste' },
  'FP-MX-006': { country: 'Mexico',   flag: '🇲🇽', product: 'Salsa Macha' },
};

// All 6 stamps in display order
window.ALL_STAMPS = [
  { country: 'Japan',    flag: '🇯🇵', product: 'Miso Yuzu Glaze',    code: 'FP-JP-001', available: true },
  { country: 'Morocco',  flag: '🇲🇦', product: 'Harissa Chermoula',  code: 'FP-MA-002', available: true },
  { country: 'Peru',     flag: '🇵🇪', product: 'Aji Amarillo Paste', code: 'FP-PE-003', available: true },
  { country: 'Thailand', flag: '🇹🇭', product: 'Nam Prik Pao',       code: 'FP-TH-004', available: false },
  { country: 'Ethiopia', flag: '🇪🇹', product: 'Berbere Paste',      code: 'FP-ET-005', available: false },
  { country: 'Mexico',   flag: '🇲🇽', product: 'Salsa Macha',        code: 'FP-MX-006', available: false },
];
