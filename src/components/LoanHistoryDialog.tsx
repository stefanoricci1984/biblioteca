import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoanHistory, type Book } from "@/hooks/useBooks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}

export function LoanHistoryDialog({ open, onOpenChange, book }: Props) {
  const { data: history, isLoading } = useLoanHistory(book?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Storico Prestiti</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">Libro: <strong>{book?.titolo}</strong></p>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Caricamento...</p>
        ) : !history?.length ? (
          <p className="text-muted-foreground text-sm">Nessun prestito passato.</p>
        ) : (
          <div className="max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestato a</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Dal</TableHead>
                  <TableHead>Al</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.prestato_a}</TableCell>
                    <TableCell>{h.prestato_telefono || "-"}</TableCell>
                    <TableCell>{h.data_inizio}</TableCell>
                    <TableCell>{h.data_fine || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
