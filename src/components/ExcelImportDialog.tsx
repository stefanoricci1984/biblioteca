import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAddBooksBatch, fetchExistingIsbns, type BookInsert } from "@/hooks/useBooks";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelImportDialog({ open, onOpenChange }: Props) {
  const [preview, setPreview] = useState<BookInsert[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const addBatch = useAddBooksBatch();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const parseYear = (val: unknown): number | null => {
        if (val == null || val === "") return null;
        if (typeof val === "number") {
          if (val >= 1000 && val <= 2100) return Math.floor(val);
          const d = new Date((val - 25569) * 86400 * 1000);
          return isNaN(d.getTime()) ? null : d.getFullYear();
        }
        const s = String(val).trim();
        if (!s) return null;
        const yearOnly = /^\d{4}$/.exec(s);
        if (yearOnly) return parseInt(yearOnly[0], 10);
        const ddmmyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyy) return parseInt(ddmmyy[3], 10);
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d.getFullYear();
      };

      const getCol = (row: Record<string, unknown>, ...keys: string[]) => {
        for (const k of keys) {
          const v = row[k];
          if (v != null && v !== "") return v;
        }
        return "";
      };

      const books: BookInsert[] = rows
        .map((r) => {
          const titolo = r["Titolo"] || r["titolo"] || r["TITOLO"] || "";
          const autori = r["Autori"] || r["autori"] || r["AUTORI"] || r["Autore"] || "";
          const editore = r["Editore"] || r["editore"] || r["EDITORE"] || "";
          const isbn = r["ISBN"] || r["isbn"] || r["Isbn"] || "";
          const annoVal = getCol(r, "Anno", "anno", "Data di pubblicazione", "Data di Pubblicazione", "Data pubblicazione", "data_pubblicazione");
          const categoria = getCol(r, "Categoria", "categoria", "CATEGORIA", "Categorie", "categorie", "Genere", "genere");
          return {
            titolo: titolo.toString().trim(),
            autori: autori?.toString().trim() || null,
            editore: editore?.toString().trim() || null,
            isbn: isbn?.toString().trim() || null,
            anno: parseYear(annoVal),
            categoria: categoria?.toString().trim() || null,
          };
        })
        .filter((b) => b.titolo);

      setPreview(books);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    try {
      const existingIsbns = await fetchExistingIsbns();
      const toInsert = preview.filter((b) => {
        const isbn = b.isbn?.replace(/\D/g, "").trim();
        if (!isbn) return true;
        return !existingIsbns.has(isbn);
      });
      const skipped = preview.length - toInsert.length;
      if (toInsert.length === 0) {
        toast.info(`Nessun libro da importare: tutti i ${preview.length} libri hanno un ISBN già presente.`);
        return;
      }
      await addBatch.mutateAsync(toInsert);
      if (skipped > 0) {
        toast.success(`${toInsert.length} libri importati. ${skipped} saltati (ISBN già presente).`);
      } else {
        toast.success(`${toInsert.length} libri importati con successo`);
      }
      setPreview([]);
      setFileName("");
      onOpenChange(false);
    } catch {
      toast.error("Errore durante l'importazione");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importa da Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Seleziona file
            </Button>
            <span className="text-sm text-muted-foreground">{fileName || "Nessun file selezionato"}</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {preview.length > 0 && (
            <>
              <p className="text-sm font-medium">{preview.length} libri trovati - Anteprima:</p>
              <div className="max-h-64 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Autori</TableHead>
                      <TableHead>Editore</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Anno</TableHead>
                      <TableHead>Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 50).map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{b.titolo}</TableCell>
                        <TableCell>{b.autori || "-"}</TableCell>
                        <TableCell>{b.editore || "-"}</TableCell>
                        <TableCell>{b.isbn || "-"}</TableCell>
                        <TableCell>{b.anno ?? "-"}</TableCell>
                        <TableCell>{b.categoria || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 50 && (
                <p className="text-xs text-muted-foreground">...e altri {preview.length - 50} libri</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPreview([]); setFileName(""); }}>Annulla</Button>
                <Button onClick={handleImport} disabled={addBatch.isPending}>
                  {addBatch.isPending ? "Importazione..." : `Importa ${preview.length} libri`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
