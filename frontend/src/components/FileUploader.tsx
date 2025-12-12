import React, { useRef, useState } from "react";
import { UploadedDocument } from "../types";
import { uploadFile, deleteDocument } from "../lib/api";

type Props = {
  documents: UploadedDocument[];
  onUploaded: (doc: UploadedDocument) => void;
  onRefresh?: () => Promise<void>;
  onDeleted?: (id: number) => void;
};

const FileUploader: React.FC<Props> = ({ documents, onUploaded, onRefresh, onDeleted }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      for (const file of Array.from(files)) {
        const doc = await uploadFile(file);
        onUploaded(doc);
      }
      if (onRefresh) {
        await onRefresh();
      }
      setSuccess("Upload complete.");
    } catch (err: any) {
      const data = err?.response?.data;
      const detail =
        (data && (data.detail || data.file?.[0] || (typeof data === "string" ? data : ""))) ||
        "Upload failed";
      setError(detail);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccess("");
    setDeletingId(id);
    try {
      await deleteDocument(id);
      onDeleted?.(id);
      if (onRefresh) {
        await onRefresh();
      }
      setSuccess("File removed.");
    } catch (err: any) {
      const data = err?.response?.data;
      const detail =
        (data && (data.detail || (typeof data === "string" ? data : ""))) || "Delete failed";
      setError(detail);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Knowledge Base</p>
          <p className="text-sm text-slate-600">PDF, TXT, DOCX are supported. Multi-select enabled.</p>
        </div>
        <span className="pill">{documents.length} file{documents.length === 1 ? "" : "s"}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        multiple
        onChange={handleUpload}
        style={{ display: "none" }}
      />
      <div className="flex items-center justify-between gap-3">
        <button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Select File(s)"}
        </button>
        {onRefresh && (
          <button onClick={onRefresh} className="btn-ghost" style={{ maxWidth: 140 }}>
            Refresh list
          </button>
        )}
      </div>
      {error && <span className="text-sm text-rose-600">{error}</span>}
      {success && <span className="text-sm text-slate-600">{success}</span>}
      <div>
        <p className="text-sm font-semibold text-slate-800">Uploaded</p>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No files yet.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex-1 overflow-hidden">
                  <span className="block truncate text-sm font-medium text-slate-800">{doc.name}</span>
                  <span className="text-xs text-slate-500">#{doc.id}</span>
                </div>
                {onDeleted && (
                  <button
                    className="btn-ghost shrink-0"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? "Removing..." : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
