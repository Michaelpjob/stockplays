-- Daily adjusted-close price history. Populated nightly by refresh-prices.yml.
-- Used to compute play performance windows (1M, 3M, YTD, 1Y) and the
-- "since inception" return for subscribed users.

create table if not exists public.stock_prices (
  ticker          text not null,
  date            date not null,
  adjusted_close  numeric(12,4) not null,
  primary key (ticker, date)
);

create index if not exists stock_prices_date_idx on public.stock_prices (date);

alter table public.stock_prices enable row level security;
drop policy if exists "prices public read" on public.stock_prices;
create policy "prices public read" on public.stock_prices for select using (true);
