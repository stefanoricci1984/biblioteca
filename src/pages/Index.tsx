import { useState } from "react";
import { useBooks, useDeleteBook, useReturnBook, type Book } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookFormDialog } from "@/components/BookFormDialog";
import { LoanDialog } from "@/components/LoanDialog";
import { LoanHistoryDialog } from "@/components/LoanHistoryDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Search, Pencil, Trash2, BookOpen, Undo2, History, RotateCcw, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tutti");
  const [annoFilter, setAnnoFilter] = useState("");
  const [posizioneFilter, setPosizioneFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const { data: books, isLoading } = useBooks(
    search,
    statusFilter === "tutti" ? undefined : statusFilter,
    annoFilter || undefined,
    posizioneFilter || undefined,
    categoriaFilter || undefined
  );
  const deleteBook = useDeleteBook();
  const returnBook = useReturnBook();

  const [editBook, setEditBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [historyBook, setHistoryBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [returnTarget, setReturnTarget] = useState<Book | null>(null);
  const [showImport, setShowImport] = useState(false);

  const total = books?.length || 0;
  const disponibili = books?.filter((b) => !b.is_prestato).length || 0;
  const prestati = total - disponibili;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBook.mutateAsync(deleteTarget.id);
      toast.success("Libro eliminato");
    } catch {
      toast.error("Errore nell'eliminazione");
    }
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("tutti");
    setAnnoFilter("");
    setPosizioneFilter("");
    setCategoriaFilter("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    try {
      await returnBook.mutateAsync(returnTarget);
      toast.success("Libro restituito. Prestito salvato nello storico.");
      setReturnTarget(null);
    } catch {
      toast.error("Errore nella restituzione");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Gestione Biblioteca</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" /> Importa Excel
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Aggiungi Libro
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout} title="Esci">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-sm text-muted-foreground">Totale Libri</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "hsl(142, 70%, 45%)" }}>{disponibili}</p>
              <p className="text-sm text-muted-foreground">Disponibili</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{prestati}</p>
              <p className="text-sm text-muted-foreground">In Prestito</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per titolo, autore, ISBN, editore..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti</SelectItem>
                <SelectItem value="disponibile">Disponibili</SelectItem>
                <SelectItem value="prestato">In Prestito</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleResetFilters} title="Azzera filtri">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Input
              type="number"
              placeholder="Cerca per Anno"
              value={annoFilter}
              onChange={(e) => setAnnoFilter(e.target.value)}
              className="min-w-[180px]"
              min={1000}
              max={2100}
            />
            <Input
              placeholder="Cerca per Posizione (es. 3/A)"
              value={posizioneFilter}
              onChange={(e) => setPosizioneFilter(e.target.value.replace(/[^0-9A-Za-z/]/g, "").toUpperCase())}
              className="min-w-[280px] font-mono"
              maxLength={10}
            />
            <Input
              placeholder="Cerca per Categoria"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="min-w-[200px]"
            />
          </div>
        </div>

        {/* Books Table */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        ) : !books?.length ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun libro trovato. Aggiungi libri manualmente o importa un file Excel.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Autori</TableHead>
                  <TableHead>Editore</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Anno</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-mono text-sm tabular-nums">{book.id}</TableCell>
                    <TableCell className="font-medium">{book.titolo}</TableCell>
                    <TableCell>{book.autori || "-"}</TableCell>
                    <TableCell>{book.editore || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{book.isbn || "-"}</TableCell>
                    <TableCell>{book.anno ?? "-"}</TableCell>
                    <TableCell>{book.categoria || "-"}</TableCell>
                    <TableCell>{book.posizione || "-"}</TableCell>
                    <TableCell>
                      {book.is_prestato ? (
                        <div>
                          <Badge variant="destructive">Prestato</Badge>
                          <p className="text-xs text-muted-foreground mt-1">a {book.prestato_a}</p>
                          <p className="text-xs text-muted-foreground">Tel. {book.prestato_telefono || "-"}</p>
                        </div>
                      ) : (
                        <Badge className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">Disponibile</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {book.is_prestato ? (
                          <Button size="icon" variant="ghost" title="Restituisci" onClick={() => setReturnTarget(book)}>
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" title="Presta" onClick={() => setLoanBook(book)}>
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="Storico" onClick={() => setHistoryBook(book)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Modifica" onClick={() => setEditBook(book)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Elimina" onClick={() => setDeleteTarget(book)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <BookFormDialog open={showAddForm} onOpenChange={setShowAddForm} />
      <BookFormDialog open={!!editBook} onOpenChange={(o) => !o && setEditBook(null)} book={editBook} />
      <LoanDialog open={!!loanBook} onOpenChange={(o) => !o && setLoanBook(null)} book={loanBook} />
      <LoanHistoryDialog open={!!historyBook} onOpenChange={(o) => !o && setHistoryBook(null)} book={historyBook} />
      <ExcelImportDialog open={showImport} onOpenChange={setShowImport} />

      <AlertDialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma restituzione</AlertDialogTitle>
            <AlertDialogDescription>
              Confermi la restituzione del libro "{returnTarget?.titolo}"? Il prestito verrà salvato nello storico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>Conferma restituzione</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget && !showDeleteConfirm} onOpenChange={(o) => !o && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo libro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deleteTarget?.titolo}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowDeleteConfirm(true)}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget && showDeleteConfirm} onOpenChange={(o) => !o && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare definitivamente "{deleteTarget?.titolo}"? L'operazione non potrà essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Conferma eliminazione
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
