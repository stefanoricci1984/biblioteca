import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddBook, useUpdateBook, type Book } from "@/hooks/useBooks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
}

export function BookFormDialog({ open, onOpenChange, book }: Props) {
  const [form, setForm] = useState({ titolo: "", autori: "", editore: "", isbn: "", posizione: "", anno: "", categoria: "" });
  const addBook = useAddBook();
  const updateBook = useUpdateBook();

  useEffect(() => {
    if (book) {
      setForm({
        titolo: book.titolo,
        autori: book.autori || "",
        editore: book.editore || "",
        isbn: book.isbn || "",
        posizione: book.posizione || "",
        anno: book.anno != null ? String(book.anno) : "",
        categoria: book.categoria || "",
      });
    } else {
      setForm({ titolo: "", autori: "", editore: "", isbn: "", posizione: "", anno: "", categoria: "" });
    }
  }, [book, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titolo.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }
    try {
      if (book) {
        await updateBook.mutateAsync({
          id: book.id,
          ...form,
          anno: form.anno ? parseInt(form.anno, 10) : null,
          categoria: form.categoria || null,
        });
        toast.success("Libro aggiornato");
      } else {
        await addBook.mutateAsync({
          ...form,
          anno: form.anno ? parseInt(form.anno, 10) : null,
          categoria: form.categoria || null,
        });
        toast.success("Libro aggiunto");
      }
      onOpenChange(false);
    } catch {
      toast.error("Errore nel salvataggio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{book ? "Modifica Libro" : "Aggiungi Libro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Titolo *</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} /></div>
          <div><Label>Autori</Label><Input value={form.autori} onChange={e => setForm(f => ({ ...f, autori: e.target.value }))} /></div>
          <div><Label>Editore</Label><Input value={form.editore} onChange={e => setForm(f => ({ ...f, editore: e.target.value }))} /></div>
          <div><Label>ISBN</Label><Input value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} /></div>
          <div><Label>Posizione</Label><Input value={form.posizione} onChange={e => setForm(f => ({ ...f, posizione: e.target.value }))} placeholder="es. Scaffale A, Ripiano 3" /></div>
          <div><Label>Anno</Label><Input type="number" value={form.anno} onChange={e => setForm(f => ({ ...f, anno: e.target.value }))} placeholder="es. 2023" min={1000} max={2100} /></div>
          <div><Label>Categoria</Label><Input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="es. Romanzo, Saggio, Manuale" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={addBook.isPending || updateBook.isPending}>
              {book ? "Salva" : "Aggiungi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
