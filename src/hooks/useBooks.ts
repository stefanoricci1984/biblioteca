import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Book = Tables<"books">;
export type BookInsert = TablesInsert<"books">;
export type LoanHistory = Tables<"loan_history">;

export function useBooks(
  search?: string,
  statusFilter?: string,
  annoFilter?: number | string,
  posizioneFilter?: string,
  categoriaFilter?: string
) {
  return useQuery({
    queryKey: ["books", search, statusFilter, annoFilter, posizioneFilter, categoriaFilter],
    queryFn: async () => {
      let query = supabase.from("books").select("*").order("id", { ascending: true });

      if (search) {
        query = query.or(
          `titolo.ilike.%${search}%,autori.ilike.%${search}%,isbn.ilike.%${search}%,editore.ilike.%${search}%`
        );
      }

      if (statusFilter === "disponibile") {
        query = query.eq("is_prestato", false);
      } else if (statusFilter === "prestato") {
        query = query.eq("is_prestato", true);
      }

      if (annoFilter !== undefined && annoFilter !== "") {
        const anno = typeof annoFilter === "string" ? parseInt(annoFilter, 10) : annoFilter;
        if (!isNaN(anno)) query = query.eq("anno", anno);
      }

      if (posizioneFilter?.trim()) {
        const pos = posizioneFilter.trim().toUpperCase();
        query = query.ilike("posizione", `%${pos}%`);
      }

      if (categoriaFilter?.trim()) {
        query = query.ilike("categoria", `%${categoriaFilter.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book: BookInsert) => {
      const { error } = await supabase.from("books").insert(book);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

function normalizeIsbn(isbn: string | null | undefined): string {
  if (!isbn) return "";
  return String(isbn).replace(/\D/g, "").trim();
}

export async function fetchExistingIsbns(): Promise<Set<string>> {
  const { data, error } = await supabase.from("books").select("isbn");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data || []) {
    const n = normalizeIsbn(row.isbn);
    if (n) set.add(n);
  }
  return set;
}

export function useAddBooksBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (books: BookInsert[]) => {
      const { error } = await supabase.from("books").insert(books);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Book> & { id: number }) => {
      const { error } = await supabase.from("books").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.from("books").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) {
        throw new Error("Impossibile eliminare il libro. Verifica di essere autenticato.");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useLoanHistory(bookId: number | undefined) {
  return useQuery({
    queryKey: ["loan_history", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_history")
        .select("*")
        .eq("book_id", bookId)
        .order("data_inizio", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
}

export function useLendBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookId,
      prestato_a,
      prestato_telefono,
      data_inizio,
      data_fine,
    }: {
      bookId: number;
      prestato_a: string;
      prestato_telefono?: string;
      data_inizio: string;
      data_fine?: string;
    }) => {
      const { error } = await supabase
        .from("books")
        .update({
          is_prestato: true,
          prestato_a,
          prestato_telefono: prestato_telefono || null,
          data_inizio,
          data_fine: data_fine || null,
        })
        .eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useReturnBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book: Book) => {
      // Save to loan history
      const { error: histError } = await supabase.from("loan_history").insert({
        book_id: book.id,
        prestato_a: book.prestato_a!,
        prestato_telefono: book.prestato_telefono || null,
        data_inizio: book.data_inizio!,
        data_fine: new Date().toISOString().split("T")[0],
      });
      if (histError) throw histError;

      // Update book
      const { error } = await supabase
        .from("books")
        .update({
          is_prestato: false,
          prestato_a: null,
          prestato_telefono: null,
          data_inizio: null,
          data_fine: null,
        })
        .eq("id", book.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["loan_history"] });
    },
  });
}
