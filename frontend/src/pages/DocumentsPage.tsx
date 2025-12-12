import React, { useEffect, useState } from "react";
import FileUploader from "../components/FileUploader";
import { fetchDocuments, uploadFile, deleteDocument } from "../lib/api";
import { UploadedDocument } from "../types";

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="card p-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Documents</p>
        <h1 className="text-2xl font-semibold text-slate-900">Manage your documents</h1>
        <p className="text-sm text-slate-600">
          Upload, view, and remove documents that you’ll attach to agents.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="card p-6 text-sm text-slate-600">Loading documents...</div>
      ) : (
        <FileUploader
          documents={documents}
          onUploaded={(doc) => setDocuments((prev) => [...prev, doc])}
          onRefresh={async () => {
            const docs = await fetchDocuments();
            setDocuments(docs);
          }}
          onDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
