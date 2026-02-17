-- Require authentication for all operations on books and loan_history
-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public select on books" ON public.books;
DROP POLICY IF EXISTS "Allow public insert on books" ON public.books;
DROP POLICY IF EXISTS "Allow public update on books" ON public.books;
DROP POLICY IF EXISTS "Allow public delete on books" ON public.books;
DROP POLICY IF EXISTS "Allow public select on loan_history" ON public.loan_history;
DROP POLICY IF EXISTS "Allow public insert on loan_history" ON public.loan_history;
DROP POLICY IF EXISTS "Allow public update on loan_history" ON public.loan_history;
DROP POLICY IF EXISTS "Allow public delete on loan_history" ON public.loan_history;

-- Create authenticated-only policies for books
CREATE POLICY "Allow authenticated select on books" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on books" ON public.books FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on books" ON public.books FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for loan_history
CREATE POLICY "Allow authenticated select on loan_history" ON public.loan_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on loan_history" ON public.loan_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on loan_history" ON public.loan_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on loan_history" ON public.loan_history FOR DELETE TO authenticated USING (true);
