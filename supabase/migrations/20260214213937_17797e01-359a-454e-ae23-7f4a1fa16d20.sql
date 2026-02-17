
-- Create books table
CREATE TABLE public.books (
  id SERIAL PRIMARY KEY,
  titolo TEXT NOT NULL,
  autori TEXT,
  editore TEXT,
  isbn TEXT,
  posizione TEXT,
  anno INTEGER,
  categoria TEXT,
  is_prestato BOOLEAN NOT NULL DEFAULT false,
  prestato_a TEXT,
  prestato_telefono TEXT,
  data_inizio DATE,
  data_fine DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_history table
CREATE TABLE public.loan_history (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  prestato_a TEXT NOT NULL,
  prestato_telefono TEXT,
  data_inizio DATE NOT NULL,
  data_fine DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_history ENABLE ROW LEVEL SECURITY;

-- Public access policies for books
CREATE POLICY "Allow public select on books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public insert on books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on books" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on books" ON public.books FOR DELETE USING (true);

-- Public access policies for loan_history
CREATE POLICY "Allow public select on loan_history" ON public.loan_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on loan_history" ON public.loan_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on loan_history" ON public.loan_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on loan_history" ON public.loan_history FOR DELETE USING (true);

-- Trigger for updated_at on books
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
