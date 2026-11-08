-- Run once in the Neon SQL editor (or: psql "$DATABASE_URL" -f db/schema.sql)

create table if not exists club_stats (
  id         int primary key default 1 check (id = 1),
  followers  int not null default 0 check (followers >= 0), -- social-media follower count
  updated_at timestamptz not null default now()
);
insert into club_stats (id, followers) values (1, 184) on conflict (id) do nothing;

-- Registered fans each own a named seat in the stadium.
create table if not exists fans (
  id           bigserial primary key,
  name         text not null check (char_length(name) between 2 and 40),
  city         text check (city is null or char_length(city) <= 40),
  seat_section char(1) not null check (seat_section in ('N','S','E','W')),
  seat_row     int not null check (seat_row >= 0),
  seat_number  int not null check (seat_number >= 0),
  created_at   timestamptz not null default now(),
  unique (seat_section, seat_row, seat_number)
);
create index if not exists fans_created_at_idx on fans (created_at desc);
