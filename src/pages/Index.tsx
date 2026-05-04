import { useState, useEffect } from "react";
import { useBooks, useDeleteBook, useReturnBook, BOOKS_PAGE_SIZE, type Book } from "@/hooks/useBooks";
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
import { Plus, Upload, Search, Pencil, Trash2, BookOpen, Undo2, History, RotateCcw, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tutti");
  const [annoFilter, setAnnoFilter] = useState("");
  const [posizioneFilter, setPosizioneFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const { data: pageData, isLoading } = useBooks(
    page,
    search,
    statusFilter === "tutti" ? undefined : statusFilter,
    annoFilter || undefined,
    posizioneFilter || undefined,
    categoriaFilter || undefined
  );
  const books = pageData?.books;
  const totalCount = pageData?.totalCount ?? 0;
  const stats = pageData?.stats ?? { totale: 0, disponibili: 0, prestati: 0 };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, annoFilter, posizioneFilter, categoriaFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / BOOKS_PAGE_SIZE));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const goToPage = (n: number) => {
    const clamped = Math.min(totalPages, Math.max(1, Math.round(n)));
    setPage(clamped);
  };
  const deleteBook = useDeleteBook();
  const returnBook = useReturnBook();

  const [editBook, setEditBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [historyBook, setHistoryBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [returnTarget, setReturnTarget] = useState<Book | null>(null);
  const [showImport, setShowImport] = useState(false);

  const handleDelete = async () => {
    const bookId = deleteTarget?.id;
    if (!bookId) return;
    setDeleteTarget(null); // chiudi subito il dialog
    try {
      await deleteBook.mutateAsync(bookId);
      toast.success("Libro eliminato");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore nell'eliminazione";
      toast.error(msg);
    }
  };

  const handleDeleteCancel = () => setDeleteTarget(null);

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
              <p className="text-2xl font-bold text-foreground">{stats.totale}</p>
              <p className="text-sm text-muted-foreground">Totale Libri</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "hsl(142, 70%, 45%)" }}>{stats.disponibili}</p>
              <p className="text-sm text-muted-foreground">Disponibili</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.prestati}</p>
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
          <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead className="w-14">ID</TableHead> */}
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
                    {/* <TableCell className="font-mono text-sm tabular-nums">{book.id}</TableCell> */}
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
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                Pagina {page} di {totalPages} · {totalCount} risultat{totalCount === 1 ? "o" : "i"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1}
                  onClick={() => goToPage(1)}
                  title="Prima pagina"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prima</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Successiva
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(totalPages)}
                  title="Ultima pagina"
                >
                  <span className="hidden sm:inline">Ultima</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 border-l pl-3 ml-1 border-border">
                  <span className="text-muted-foreground whitespace-nowrap">Vai a</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    className="h-8 w-14 text-center tabular-nums px-1"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const n = parseInt(pageInput, 10);
                        if (!Number.isNaN(n)) goToPage(n);
                        else setPageInput(String(page));
                      }
                    }}
                    onBlur={() => {
                      const n = parseInt(pageInput, 10);
                      if (!Number.isNaN(n)) goToPage(n);
                      else setPageInput(String(page));
                    }}
                  />
                  <span className="tabular-nums text-muted-foreground">/ {totalPages}</span>
                </div>
              </div>
            </div>
          )}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo libro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deleteTarget?.titolo}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              Elimina
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
