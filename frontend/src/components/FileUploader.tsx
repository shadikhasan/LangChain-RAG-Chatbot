import React, { useRef, useState } from "react";
import { UploadedDocument } from "../types";
import { uploadFile } from "../api";

type Props = {
  documents: UploadedDocument[];
  onUploaded: (doc: UploadedDocument) => void;
};

const FileUploader: React.FC<Props> = ({ documents, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const doc = await uploadFile(file);
      onUploaded(doc);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="panel stack">
      <h3>Knowledge Base</h3>
      <p className="subtle">PDF, TXT, DOCX are supported. We will chunk and embed these for RAG.</p>
      <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleUpload} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? "Uploading..." : "Select File"}
      </button>
      {error && <span style={{ color: "crimson" }}>{error}</span>}
      <div>
        <strong>Uploaded:</strong>
        {documents.length === 0 ? (
          <p className="subtle">No files yet.</p>
        ) : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.name} <span className="subtle">#{doc.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
