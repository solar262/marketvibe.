insert into categories (name, slug, description, image) values
('Workspace', 'workspace', 'Desk tools and productivity upgrades.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80'),
('Home Essentials', 'home-essentials', 'Compact home goods with supplier availability.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'),
('Everyday Tech', 'everyday-tech', 'Useful accessories with clean margins.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80')
on conflict (slug) do nothing;

insert into settings (id, store_name, support_email, default_shipping_message, homepage_hero_text, seo_title, seo_description)
values (1, 'MarketVibe Pro', 'support@marketvibepro.example', 'Most products ship in 5-14 business days from vetted suppliers.', 'Launch a clean dropshipping marketplace without Shopify fees', 'MarketVibe Pro', 'A minimalist dropshipping marketplace engine for independent operators.')
on conflict (id) do update set store_name = excluded.store_name;
