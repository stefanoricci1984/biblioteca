import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";

/** Evita `ReturnType<typeof supabase.from<"books">>`: TypeScript non accetta argomenti generici su `typeof`. */
type BooksQueryBuilder = ReturnType<SupabaseClient<Database>["from"]>;

export type Book = Tables<"books">;
export type BookInsert = TablesInsert<"books">;
export type LoanHistory = Tables<"loan_history">;

/** PostgREST/Supabase limita di default a 1000 righe per richiesta: senza paginazione i libri oltre quel limite non compaiono. */
export const BOOKS_PAGE_SIZE = 50;

type StatusFilterArg = "disponibile" | "prestato" | undefined;

function applyBookFilters(
  query: BooksQueryBuilder,
  search: string | undefined,
  statusFilter: StatusFilterArg,
  annoFilter: number | string | undefined,
  posizioneFilter: string | undefined,
  categoriaFilter: string | undefined
) {
  let q = query;

  if (search) {
    q = q.or(
      `titolo.ilike.%${search}%,autori.ilike.%${search}%,isbn.ilike.%${search}%,editore.ilike.%${search}%`
    );
  }

  if (statusFilter === "disponibile") {
    q = q.eq("is_prestato", false);
  } else if (statusFilter === "prestato") {
    q = q.eq("is_prestato", true);
  }

  if (annoFilter !== undefined && annoFilter !== "") {
    const anno = typeof annoFilter === "string" ? parseInt(annoFilter, 10) : annoFilter;
    if (!isNaN(anno)) q = q.eq("anno", anno);
  }

  if (posizioneFilter?.trim()) {
    const pos = posizioneFilter.trim().toUpperCase();
    q = q.ilike("posizione", `%${pos}%`);
  }

  if (categoriaFilter?.trim()) {
    q = q.ilike("categoria", `%${categoriaFilter.trim()}%`);
  }

  return q;
}

export type BooksPageResult = {
  books: Book[];
  totalCount: number;
  /** Per le card riepilogo (stessi filtri di ricerca, senza contare il filtro "stato" tabella se serve lo split) */
  stats: { totale: number; disponibili: number; prestati: number };
};

export function useBooks(
  page: number,
  search?: string,
  statusFilter?: string,
  annoFilter?: number | string,
  posizioneFilter?: string,
  categoriaFilter?: string,
  pageSize: number = BOOKS_PAGE_SIZE
) {
  const status = statusFilter as StatusFilterArg;

  return useQuery({
    queryKey: ["books", page, pageSize, search, statusFilter, annoFilter, posizioneFilter, categoriaFilter],
    queryFn: async (): Promise<BooksPageResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let listQuery = applyBookFilters(
        supabase.from("books").select("*", { count: "exact" }),
        search,
        status,
        annoFilter,
        posizioneFilter,
        categoriaFilter
      )
        .order("id", { ascending: false })
        .range(from, to);

      const [{ data, error, count }, stats] = await Promise.all([
        listQuery,
        (async (): Promise<BooksPageResult["stats"]> => {
          if (status === "disponibile") {
            const q = applyBookFilters(
              supabase.from("books").select("*", { count: "exact", head: true }),
              search,
              "disponibile",
              annoFilter,
              posizioneFilter,
              categoriaFilter
            );
            const { count: n } = await q;
            const t = n ?? 0;
            return { totale: t, disponibili: t, prestati: 0 };
          }
          if (status === "prestato") {
            const q = applyBookFilters(
              supabase.from("books").select("*", { count: "exact", head: true }),
              search,
              "prestato",
              annoFilter,
              posizioneFilter,
              categoriaFilter
            );
            const { count: n } = await q;
            const t = n ?? 0;
            return { totale: t, disponibili: 0, prestati: t };
          }
          const [dispRes, prestRes] = await Promise.all([
            applyBookFilters(
              supabase.from("books").select("*", { count: "exact", head: true }),
              search,
              "disponibile",
              annoFilter,
              posizioneFilter,
              categoriaFilter
            ),
            applyBookFilters(
              supabase.from("books").select("*", { count: "exact", head: true }),
              search,
              "prestato",
              annoFilter,
              posizioneFilter,
              categoriaFilter
            ),
          ]);
          const disponibili = dispRes.count ?? 0;
          const prestati = prestRes.count ?? 0;
          return { totale: disponibili + prestati, disponibili, prestati };
        })(),
      ]);

      if (error) throw error;

      return {
        books: data ?? [],
        totalCount: count ?? 0,
        stats,
      };
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
  const set = new Set<string>();
  const batch = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("books")
      .select("isbn")
      .order("id", { ascending: true })
      .range(from, from + batch - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      const n = normalizeIsbn(row.isbn);
      if (n) set.add(n);
    }
    if (data.length < batch) break;
    from += batch;
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
