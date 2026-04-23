select pg_get_functiondef(
  'kernel.resolve_obligation_internal(uuid,uuid,text,text,jsonb,jsonb,text,text,text)'::regprocedure
);