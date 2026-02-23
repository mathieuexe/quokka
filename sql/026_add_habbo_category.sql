INSERT INTO categories (id, slug, label, image_url)
SELECT gen_random_uuid(), 'habbo', 'Habbo', 'https://cdn.simpleicons.org/habbo'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'habbo'
);
