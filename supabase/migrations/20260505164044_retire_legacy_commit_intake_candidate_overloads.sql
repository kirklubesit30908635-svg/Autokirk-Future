-- Task 0E: Retire two legacy commit_intake_candidate overloads
-- Canonical signature retained: includes obligation_code + occurred_at
drop function if exists api.commit_intake_candidate(uuid, uuid, text, text, text, text, text, text, text);
drop function if exists api.commit_intake_candidate(uuid, uuid, uuid, text, text, text, text);
