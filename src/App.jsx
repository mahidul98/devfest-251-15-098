import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./index.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function App() {
  const [tender, setTender] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState({});

  // -----------------------------
  // LOAD REQUIREMENTS.JSON
  // -----------------------------
  function loadRequirements(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        setTender(data.tender);

        setRequirements(
          [...data.requirements].sort(
            (a, b) => a.order - b.order
          )
        );

        setMatches({});
      } catch {
        alert("Invalid requirements.json file.");
      }
    };

    reader.readAsText(file);
  }

  // -----------------------------
  // READ PDF PAGE COUNT
  // -----------------------------
  async function getFileHash(file) {
  const buffer = await file.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    buffer
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
  async function getPageCount(file) {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

    return pdf.numPages;
  }

  // -----------------------------
  // UPLOAD PDF FILES
  // -----------------------------
  async function handlePdfUpload(event) {
    const selectedFiles = Array.from(event.target.files);

    const validFiles = selectedFiles.filter((file) => {
      return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      );
    });

    const invalidFiles = selectedFiles.filter((file) => {
      return !(
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      );
    });

    if (invalidFiles.length > 0) {
      alert(
        `${invalidFiles.length} non-PDF file(s) were rejected.`
      );
    }

    const newFiles = [];

for (const file of validFiles) {
  try {
    const pages = await getPageCount(file);
    const hash = await getFileHash(file);

    newFiles.push({
          id:
            Date.now().toString() +
            Math.random().toString(36).slice(2),
          file,
          name: file.name,
          size: file.size,
          pages,
          hash
        });
      } catch {
        alert(`${file.name} could not be read as a PDF.`);
      }
    }

    setFiles((previous) => [
      ...previous,
      ...newFiles,
    ]);

    event.target.value = "";
  }

  // -----------------------------
  // MATCH FILE TO REQUIREMENT
  // -----------------------------
  function matchFile(requirementId, fileId) {
    setMatches((previous) => {
      const updated = { ...previous };

      // Remove this file from any previous requirement
      Object.keys(updated).forEach((reqId) => {
        if (updated[reqId] === fileId) {
          delete updated[reqId];
        }
      });

      if (fileId) {
        updated[requirementId] = fileId;
      } else {
        delete updated[requirementId];
      }

      return updated;
    });
  }

  // -----------------------------
  // REMOVE FILE
  // -----------------------------
  function removeFile(fileId) {
    setFiles((previous) =>
      previous.filter((item) => item.id !== fileId)
    );

    setMatches((previous) => {
      const updated = { ...previous };

      Object.keys(updated).forEach((reqId) => {
        if (updated[reqId] === fileId) {
          delete updated[reqId];
        }
      });

      return updated;
    });
  }

  // -----------------------------
  // STATUS
  // -----------------------------
  function getStatus(requirement) {
    const fileId = matches[requirement.id];

    if (!fileId) {
      return requirement.mandatory
        ? "Missing"
        : "Not provided";
    }

    if (requirement.has_expiry) {
      return "Expiry date needed";
    }

    return "OK";
  }

  function getStatusClass(status) {
    if (status === "OK") return "ok";
    if (status === "Not provided") return "not-provided";
    if (status === "Expiry date needed") return "expiry-needed";
    return "missing";
  }

function isDuplicate(fileId) {
  const currentFile = files.find(
    (item) => item.id === fileId
  );

  if (!currentFile) return false;

  return files.some(
    (item) =>
      item.id !== fileId &&
      item.hash === currentFile.hash
  );
}

return (
  <div className="app">

      {/* HEADER */}
      <header className="header">

        <div>
          <h1>Tender Package Builder</h1>

          <p>
            Prepare, check and generate a complete tender package.
          </p>
        </div>

        <button className="language-btn">
          বাংলা
        </button>

      </header>

      <main>

        {/* REQUIREMENTS */}
        <section className="card">

          <div className="section-title">

            <div>
              <span className="step">01</span>

              <div>
                <h2>Tender Requirements</h2>

                <p>
                  Load the tender's requirements.json file.
                </p>
              </div>
            </div>

          </div>

          <label className="upload-area">

            <input
              type="file"
              accept=".json,application/json"
              onChange={loadRequirements}
            />

            <div className="upload-icon">↑</div>

            <strong>
              Choose requirements.json
            </strong>

            <span>
              Click here to load the tender requirements
            </span>

          </label>

        </section>

        {/* TENDER INFORMATION */}
        {tender && (

          <section className="card">

            <div className="section-heading">

              <div>
                <h2>Tender Information</h2>
              </div>

            </div>

            <div className="tender-grid">

              <div>
                <label>Tender ID</label>
                <strong>{tender.tender_id}</strong>
              </div>

              <div>
                <label>Submission Deadline</label>
                <strong>
                  {tender.submission_deadline}
                </strong>
              </div>

              <div>
                <label>Tender Title</label>
                <strong>{tender.title}</strong>
              </div>

              <div>
                <label>Procuring Entity</label>
                <strong>
                  {tender.procuring_entity}
                </strong>
              </div>

              <div>
                <label>Bidder</label>
                <strong>{tender.bidder}</strong>
              </div>

            </div>

          </section>

        )}

        {/* PDF UPLOAD */}
        <section className="card">

          <div className="section-heading">

            <div>
              <h2>Upload PDF Documents</h2>

              <p>
                Upload all PDF files belonging to this tender.
              </p>
            </div>

            {files.length > 0 && (
              <span className="count">
                {files.length} files
              </span>
            )}

          </div>

          <label className="upload-area">

            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handlePdfUpload}
            />

            <div className="upload-icon">↑</div>

            <strong>
              Choose PDF files
            </strong>

            <span>
              You can select multiple PDF files at once
            </span>

          </label>

          {/* FILE LIST */}

          {files.length > 0 && (

            <div className="file-list">

              {files.map((item) => {

                const matchedRequirement =
                  Object.keys(matches).find(
                    (reqId) =>
                      matches[reqId] === item.id
                  );

                const matchedDocument =
                  requirements.find(
                    (req) =>
                      req.id === matchedRequirement
                  );

                return (

                  <div
                    className="file-item"
                    key={item.id}
                  >

<div className="file-info">

  <strong>
    {item.name}
  </strong>

  {isDuplicate(item.id) && (
    <span className="duplicate-warning">
      Duplicate file
    </span>
  )}

                      <span>
                        {item.pages}{" "}
                        {item.pages === 1
                          ? "page"
                          : "pages"}
                        {" • "}
                        {(item.size / 1024 / 1024).toFixed(2)}
                        {" MB"}
                      </span>

                    </div>

                    <div className="file-match">

                      {matchedDocument ? (
                        <span className="matched">
                          Matched:{" "}
                          {matchedDocument.title_en}
                        </span>
                      ) : (
                        <span className="unmatched">
                          Not matched
                        </span>
                      )}

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeFile(item.id)
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

        {/* DOCUMENT MATCHING */}
        {requirements.length > 0 && (

          <section className="card">

            <div className="section-heading">

              <div>
                <h2>Document Checklist</h2>

                <p>
                  Match each uploaded PDF to a requirement.
                </p>
              </div>

            </div>

            <div className="requirements">

              {requirements.map((req) => {

                const status =
                  getStatus(req);

                const selectedFile =
                  matches[req.id] || "";

                return (

                  <div
                    className="requirement"
                    key={req.id}
                  >

                    <div className="requirement-number">
                      {req.order}
                    </div>

                    <div className="requirement-info">

                      <strong>
                        {req.title_en}
                      </strong>

                      <span>
                        {req.mandatory
                          ? "Mandatory"
                          : "Optional"}

                        {req.has_expiry &&
                          " • Expiry date required"}
                      </span>

                    </div>

                    <select
                      value={selectedFile}
                      onChange={(e) =>
                        matchFile(
                          req.id,
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        Select PDF...
                      </option>

                      {files.map((item) => {
  const duplicate = isDuplicate(item.id);

  const usedByAnotherRequirement =
    Object.keys(matches).some(
      (reqId) =>
        reqId !== req.id &&
        matches[reqId] === item.id
    );

  return (
    <option
      key={item.id}
      value={item.id}
      disabled={duplicate || usedByAnotherRequirement}
    >
      {item.name}
      {" "}
      ({item.pages} pages)
      {duplicate ? " — DUPLICATE" : ""}
      {usedByAnotherRequirement ? " — ALREADY USED" : ""}
    </option>
  );
})}

                    </select>

                    <div
                      className={`status ${getStatusClass(
                        status
                      )}`}
                    >
                      {status}
                    </div>

                  </div>

                );

              })}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;