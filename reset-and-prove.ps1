supabase db reset
supabase db query --file .\sql\verify\00_bootstrap_context.sql
supabase db query --file .\sql\verify\08_prove_full_loop.sql --output table
supabase db query --file .\sql\verify\09_prove_performance_path.sql --output table
supabase db query --file .\sql\verify\05_full_lifecycle_from_ingest.sql --output table
supabase db query --file .\sql\verify\06_receipt_idempotency_integrity.sql --output table
supabase db query --file .\sql\verify\07_no_duplicate_truth.sql --output table