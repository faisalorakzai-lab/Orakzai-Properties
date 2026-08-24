# KYC Supabase audit

Source: https://supabase.com/dashboard/project/nkgkuwhumjgohgfdzflh/sql/f42428ca-1df9-4e62-b75e-6eb4c65e2e43

- Initial REST request to `/rest/v1/profiles` returned HTTP 404 because `public.profiles` did not exist.
- SQL check `select to_regclass('public.profiles'), to_regclass('storage.buckets')` returned `profiles_table = NULL` and `buckets_table = storage.buckets` before bootstrap.
- Minimal bootstrap migration completed successfully and created `public.profiles` plus private bucket `kyc-documents`.
- Focused RLS migration failed at `alter table storage.objects enable row level security` with `ERROR: 42501: must be owner of table objects`; because the statements were run transactionally, the profiles RLS statements in that same batch may have rolled back. Storage.objects RLS must not be altered by this SQL Editor role. Need apply only profiles policies separately, and configure storage object policies through supported Storage policy UI or an owner-capable migration.
- Supabase storage already has private bucket `verification-documents`; a `kyc-documents` bucket was created by the bootstrap.
- App KYC submit path was patched to use `supabaseUser.id`, correct Firebase email (`primaryEmailAddress.emailAddress`), upload docFront/docBack/selfie/addressDoc, and persist `document_urls` JSONB. Generic errors now surface the backend message.
- `profiles` table currently has owner-oriented fields including `clerk_user_id`, `supabase_user_id`, KYC status/timestamps, personal fields, document type fields, `document_urls`, and timestamps.
