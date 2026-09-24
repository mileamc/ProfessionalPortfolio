-- The boarding pass on the About page writes one row here per check-in.
-- Run this once, in the Supabase SQL editor, on project seiuolaoyycdinvfzwoq.
--
-- Everything in it is safe to run twice: the table, the index and the
-- publication are all guarded.

create table if not exists public.checkins (
    id             uuid        primary key default gen_random_uuid(),
    city           text        not null check (char_length(city)    between 1 and 80),
    country        text        not null check (char_length(country) between 1 and 80),
    -- half the Earth's circumference is 20,015km, so nothing real is over 20,100
    distance_km    integer     not null check (distance_km    between 0 and 20100),
    distance_miles integer     not null check (distance_miles between 0 and 12500),
    created_at     timestamptz not null default now()
);

-- the board only ever asks for the newest few
create index if not exists checkins_created_at_idx
    on public.checkins (created_at desc);

alter table public.checkins enable row level security;

-- Read and write are open; changing and removing are not. There is no policy
-- for update or delete, and under row level security no policy means refused,
-- so a visitor cannot touch a row once it is written — not even their own.
drop policy if exists "anyone may read the board" on public.checkins;
create policy "anyone may read the board"
    on public.checkins for select
    to anon, authenticated
    using (true);

drop policy if exists "anyone may check in" on public.checkins;
create policy "anyone may check in"
    on public.checkins for insert
    to anon, authenticated
    with check (true);

-- The same shape again at the grant level, under the policies rather than
-- beside them: the role is not given the right to update or delete at all.
revoke all on public.checkins from anon, authenticated;
grant select, insert on public.checkins to anon, authenticated;

-- And let the board hear about new rows as they land. Postgres has no
-- "add table if not exists" for a publication, so the one statement that
-- would complain on a second run is wrapped in a block that swallows the
-- complaint. Written with a single-quoted body rather than the usual $$,
-- which some editors mistake for something else.
do 'begin
    alter publication supabase_realtime add table public.checkins;
exception
    when duplicate_object then null;   -- already published
end';
