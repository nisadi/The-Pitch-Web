-- Align contact_messages with per-reference replies (inReplyTo + thread_key)

alter table public.contact_messages
  add column if not exists thread_key text;

update public.contact_messages
set thread_key = case
  when nullif(trim(email), '') is not null then 'email:' || lower(trim(email))
  when nullif(regexp_replace(phone, '\D', '', 'g'), '') is not null
    then 'phone:' || regexp_replace(phone, '\D', '', 'g')
  else 'ref:' || id::text
end
where thread_key is null;

create index if not exists contact_messages_thread_key_idx
  on public.contact_messages (thread_key);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- Normalize each admin reply: inReplyTo + created_at
update public.contact_messages cm
set replies = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', elem->>'id',
        'inReplyTo', coalesce(
          nullif(elem->>'inReplyTo', ''),
          nullif(elem->>'in_reply_to', ''),
          cm.reference_code
        ),
        'author', coalesce(elem->>'author', 'Admin'),
        'message', elem->>'message',
        'date', elem->>'date',
        'time', elem->>'time',
        'created_at', coalesce(
          nullif(elem->>'created_at', ''),
          nullif(elem->>'createdAt', ''),
          (elem->>'date') || 'T' || coalesce(nullif(elem->>'time', ''), '00:00') || ':00+00:00'
        )
      )
      order by coalesce(
        nullif(elem->>'created_at', '')::timestamptz,
        (elem->>'date')::timestamptz
      )
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(cm.replies) elem
)
where replies is not null
  and jsonb_typeof(replies) = 'array'
  and jsonb_array_length(replies) > 0;

-- Menaka thread: keep first reply on ENQ-2402; move stray reply to ENQ-2402B
update public.contact_messages
set replies = '[
  {
    "id": "REP-2402-1",
    "inReplyTo": "ENQ-2402",
    "author": "Admin User",
    "message": "Yes, we offer monthly memberships at Attidiya. Peak is LKR 4,500/month and non-peak is LKR 3,200/month. Reply if you would like to sign up.",
    "date": "2026-05-18",
    "time": "11:30",
    "created_at": "2026-05-18T11:30:00+00:00"
  }
]'::jsonb,
updated_at = now()
where reference_code = 'ENQ-2402';

update public.contact_messages
set replies = '[
  {
    "id": "REP-1779275654749",
    "inReplyTo": "ENQ-2402B",
    "author": "Admin User",
    "message": "hi",
    "date": "2026-05-20",
    "time": "16:44",
    "created_at": "2026-05-20T16:44:00+00:00"
  }
]'::jsonb,
updated_at = now()
where reference_code = 'ENQ-2402B';

-- ENQ-2405 admin reply
update public.contact_messages
set replies = '[
  {
    "id": "REP-2405-1",
    "inReplyTo": "ENQ-2405",
    "author": "Admin User",
    "message": "Your refund for BK-10461 has been processed. It should appear on your card within 5–7 business days.",
    "date": "2026-05-16",
    "time": "14:00",
    "created_at": "2026-05-16T14:00:00+00:00"
  }
]'::jsonb,
updated_at = now()
where reference_code = 'ENQ-2405';

comment on column public.contact_messages.reference_code is
  'Internal reference shown in admin (e.g. ENQ-2402). Unique per customer submission.';

comment on column public.contact_messages.replies is
  'Admin replies: [{ id, inReplyTo, author, message, date, time, created_at }] — tied to reference_code.';

comment on column public.contact_messages.thread_key is
  'email:… or phone:… — groups multiple submissions from the same contact.';
