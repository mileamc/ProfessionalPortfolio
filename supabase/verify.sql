-- Read-only. Run it after checkins.sql to see that the four things the
-- boarding pass needs are in place. Every column should come back true.

select
    (to_regclass('public.checkins') is not null)                     as table_there,
    (select relrowsecurity from pg_class
      where oid = 'public.checkins'::regclass)                       as rls_on,
    (select count(*) = 2 from pg_policies
      where schemaname = 'public' and tablename = 'checkins')        as two_policies,
    (select count(*) = 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = 'checkins')        as published,
    (select count(*) from public.checkins)                           as rows_so_far;
