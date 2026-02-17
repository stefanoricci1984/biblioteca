import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLendBook, type Book } from "@/hooks/useBooks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}

export function LoanDialog({ open, onOpenChange, book }: Props) {
  const [prestato_a, setPrestatoA] = useState("");
  const [prestato_telefono, setPrestatoTelefono] = useState("");
  const [data_inizio, setDataInizio] = useState(new Date().toISOString().split("T")[0]);
  const [data_fine, setDataFine] = useState("");
  const lendBook = useLendBook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !prestato_a.trim()) {
      toast.error("Inserisci il nome della persona");
      return;
    }
    try {
      await lendBook.mutateAsync({
        bookId: book.id,
        prestato_a,
        prestato_telefono: prestato_telefono.trim() || undefined,
        data_inizio,
        data_fine: data_fine || undefined,
      });
      toast.success("Prestito registrato");
      onOpenChange(false);
      setPrestatoA("");
      setPrestatoTelefono("");
      setDataFine("");
    } catch {
      toast.error("Errore nel salvataggio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra Prestito</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Libro: <strong>{book?.titolo}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Prestato a *</Label><Input value={prestato_a} onChange={e => setPrestatoA(e.target.value)} placeholder="Nome e cognome" /></div>
          <div><Label>Numero di telefono</Label><Input type="tel" value={prestato_telefono} onChange={e => setPrestatoTelefono(e.target.value)} placeholder="+39 333 1234567" /></div>
          <div><Label>Data inizio</Label><Input type="date" value={data_inizio} onChange={e => setDataInizio(e.target.value)} /></div>
          <div><Label>Data fine prevista</Label><Input type="date" value={data_fine} onChange={e => setDataFine(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={lendBook.isPending}>Registra</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
