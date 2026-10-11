-- Existing spread offers. Run in Supabase SQL Editor before deployment.
-- Existing rows are left unchanged when this script is run again.
-- Mixed offer composition (2 spread + 2 bars) remains in landing code.
insert into public.offers
  (site, slug, name, badge, description, note, price, original_price, units, units_label, flavors, accent, delivery_note, free_shipping, sort_order)
values
  ('spread', 'two-jars', 'العرض الأول', 'توفير 🔥', 'عرض القطعتين ب 499 جنيه بدلاً من 600 جنيه', '', 499, 600, 2, '2 برطمان سبريد', '[]'::jsonb, '#5f2d91', 'التوصيل مجاني', true, 1),
  ('spread', 'three-jars', 'العرض الثاني', '⭐ الأكثر طلبًا', 'عرض ال 3 قطع ب 699 جنيه بدلاً من 900 جنيه', '', 699, 900, 3, '3 برطمان سبريد', '[]'::jsonb, '#b11730', 'التوصيل مجاني', true, 2),
  ('spread', 'four-jars', 'العرض الثالث', 'أكبر توفير 🔥', 'عرض ال 4 قطع ب 899 جنيه بدلاً من 1200 جنيه', '', 899, 1200, 4, '4 برطمان سبريد', '[]'::jsonb, '#0f766e', 'التوصيل مجاني', true, 3),
  ('spread', 'choco-bar', 'عرض شيكولاتة بار', '🎁 الخامسة هدية', 'اشتري 4 شيكولاتة 40 جرام واحصل على الخامسة هدية ب 220 جنيه بدلاً من 275 جنيه', '', 220, 275, 5, '5 قطع شيكولاتة بار', '[]'::jsonb, '#b11730', 'التوصيل مجاني', true, 4),
  ('spread', 'spread-choco-bar', 'عرض سبريد + شيكولاتة بار', '✨ عرض مميز', 'اشتري 2 شيكولاتة سبريد + 2 شيكولاتة بار ب 599 جنيه بدلاً من 710 جنيه', '', 599, 710, 4, '2 سبريد + 2 بار', '[]'::jsonb, '#5f2d91', 'التوصيل مجاني', true, 5)
on conflict (site, slug) do nothing;