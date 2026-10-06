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
  const [expiryDates, setExpiryDates] = useState({});
  const [language, setLanguage] = useState("en");

  // -----------------------------
  // UI LANGUAGE
  // -----------------------------
  const text = {
    en: {
      title: "Tender Package Builder",
      subtitle:
        "Prepare, check and generate a complete tender package.",
      bengali: "বাংলা",
      english: "English",

      tenderRequirements: "Tender Requirements",
      loadRequirements:
        "Load the tender's requirements.json file.",
      chooseRequirements: "Choose requirements.json",
      clickLoad:
        "Click here to load the tender requirements",

      tenderInformation: "Tender Information",
      tenderId: "Tender ID",
      deadline: "Submission Deadline",
      tenderTitle: "Tender Title",
      procuringEntity: "Procuring Entity",
      bidder: "Bidder",

      uploadDocuments: "Upload PDF Documents",
      uploadDescription:
        "Upload all PDF files belonging to this tender.",
      choosePdf: "Choose PDF files",
      multiplePdf:
        "You can select multiple PDF files at once",

      files: "files",
      page: "page",
      pages: "pages",
      duplicate: "Duplicate file",
      matched: "Matched",
      notMatched: "Not matched",
      remove: "Remove",

      documentChecklist: "Document Checklist",
      checklistDescription:
        "Match each uploaded PDF to a requirement.",
      autoMatch: "Auto Match Documents",
      autoMatchDone: "Documents Auto-Matched",

      mandatory: "Mandatory",
      optional: "Optional",
      expiryRequired: "Expiry date required",
      selectPdf: "Select PDF...",
      alreadyUsed: "ALREADY USED",
      duplicateUsed: "DUPLICATE ALREADY USED",

      missing: "Missing",
      notProvided: "Not provided",
      expiryNeeded: "Expiry date needed",
      expired: "Expired",
      ok: "OK",

      autoMatchInfo:
        "Automatically match PDFs to requirements using their filenames.",

      invalidRequirements:
        "Invalid requirements.json file.",
    },

    bn: {
      title: "টেন্ডার প্যাকেজ বিল্ডার",
      subtitle:
        "সম্পূর্ণ টেন্ডার প্যাকেজ প্রস্তুত, যাচাই এবং তৈরি করুন।",
      bengali: "English",
      english: "English",

      tenderRequirements: "টেন্ডারের প্রয়োজনীয়তা",
      loadRequirements:
        "টেন্ডারের requirements.json ফাইল লোড করুন।",
      chooseRequirements: "requirements.json নির্বাচন করুন",
      clickLoad:
        "টেন্ডারের প্রয়োজনীয়তা লোড করতে এখানে ক্লিক করুন",

      tenderInformation: "টেন্ডার তথ্য",
      tenderId: "টেন্ডার আইডি",
      deadline: "জমা দেওয়ার শেষ সময়",
      tenderTitle: "টেন্ডারের শিরোনাম",
      procuringEntity: "ক্রয়কারী প্রতিষ্ঠান",
      bidder: "বিডার",

      uploadDocuments: "PDF ডকুমেন্ট আপলোড করুন",
      uploadDescription:
        "এই টেন্ডারের সব PDF ফাইল আপলোড করুন।",
      choosePdf: "PDF ফাইল নির্বাচন করুন",
      multiplePdf:
        "একসাথে একাধিক PDF ফাইল নির্বাচন করতে পারবেন",

      files: "টি ফাইল",
      page: "পৃষ্ঠা",
      pages: "পৃষ্ঠা",
      duplicate: "ডুপ্লিকেট ফাইল",
      matched: "ম্যাচ হয়েছে",
      notMatched: "ম্যাচ হয়নি",
      remove: "মুছুন",

      documentChecklist: "ডকুমেন্ট চেকলিস্ট",
      checklistDescription:
        "প্রতিটি PDF-কে একটি প্রয়োজনীয় ডকুমেন্টের সাথে মিলান।",
      autoMatch: "ডকুমেন্ট অটো ম্যাচ করুন",
      autoMatchDone: "ডকুমেন্ট অটো-ম্যাচ হয়েছে",

      mandatory: "আবশ্যিক",
      optional: "ঐচ্ছিক",
      expiryRequired: "মেয়াদ শেষের তারিখ প্রয়োজন",
      selectPdf: "PDF নির্বাচন করুন...",
      alreadyUsed: "ইতিমধ্যে ব্যবহৃত",
      duplicateUsed: "ডুপ্লিকেট ইতিমধ্যে ব্যবহৃত",

      missing: "অনুপস্থিত",
      notProvided: "দেওয়া হয়নি",
      expiryNeeded: "মেয়াদ শেষের তারিখ প্রয়োজন",
      expired: "মেয়াদ শেষ",
      ok: "ঠিক আছে",

      autoMatchInfo:
        "ফাইলের নাম ব্যবহার করে PDF-কে স্বয়ংক্রিয়ভাবে প্রয়োজনীয় ডকুমেন্টের সাথে মিলানো হবে।",

      invalidRequirements:
        "ভুল requirements.json ফাইল।",
    },
  };

  const t = text[language];

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
        setExpiryDates({});
      } catch {
        alert(t.invalidRequirements);
      }
    };

    reader.readAsText(file);
  }

  // -----------------------------
  // FILE HASH
  // -----------------------------
  async function getFileHash(file) {
    const buffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");
  }

  // -----------------------------
  // PDF PAGE COUNT
  // -----------------------------
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
    const selectedFiles = Array.from(
      event.target.files
    );

    const validFiles = selectedFiles.filter((file) => {
      return (
        file.type === "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf")
      );
    });

    const invalidFiles = selectedFiles.filter((file) => {
      return !(
        file.type === "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf")
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
            Math.random()
              .toString(36)
              .slice(2),
          file,
          name: file.name,
          size: file.size,
          pages,
          hash,
        });
      } catch {
        alert(
          `${file.name} could not be read as a PDF.`
        );
      }
    }

    setFiles((previous) => [
      ...previous,
      ...newFiles,
    ]);

    event.target.value = "";
  }

  // -----------------------------
  // DUPLICATE CHECK
  // -----------------------------
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

  // -----------------------------
  // NORMALIZE TEXT
  // -----------------------------
  function normalizeText(value) {
    return value
      .toLowerCase()
      .replace(/\.pdf$/i, "")
      .replace(/[_\-().]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // -----------------------------
  // AUTO MATCH
  // -----------------------------
  function calculateMatchScore(file, requirement) {
    const fileName = normalizeText(
      file.name
    );

    const titleEn = normalizeText(
      requirement.title_en || ""
    );

    const titleBn = normalizeText(
      requirement.title_bn || ""
    );

    const fileWords = fileName
      .split(" ")
      .filter(Boolean);

    const titleWords = [
      ...titleEn.split(" "),
      ...titleBn.split(" "),
    ].filter(Boolean);

    let score = 0;

    // Exact title match
    if (
      titleEn &&
      fileName.includes(titleEn)
    ) {
      score += 100;
    }

    // Individual matching words
    titleWords.forEach((word) => {
      if (
        word.length >= 3 &&
        fileName.includes(word)
      ) {
        score += 10;
      }
    });

    // Useful keyword matching
    const keywordGroups = [
      ["financial", "finance", "financial proposal"],
      ["technical", "technical proposal"],
      ["tin", "tin certificate"],
      ["vat", "vat certificate"],
      ["bank", "solvency", "bank solvency"],
      ["experience", "experience certificate"],
      ["trade", "license", "licence"],
    ];

    keywordGroups.forEach((group) => {
      const fileHasKeyword =
        group.some((word) =>
          fileName.includes(word)
        );

      const requirementHasKeyword =
        group.some(
          (word) =>
            titleEn.includes(word) ||
            titleBn.includes(word)
        );

      if (
        fileHasKeyword &&
        requirementHasKeyword
      ) {
        score += 40;
      }
    });

    return score;
  }

  function autoMatchDocuments() {
    if (
      files.length === 0 ||
      requirements.length === 0
    ) {
      return;
    }

    const newMatches = {};
    const usedFileIds = new Set();
    const usedRequirementIds = new Set();

    const possibleMatches = [];

    files.forEach((file) => {
      requirements.forEach((req) => {
        const score =
          calculateMatchScore(file, req);

        if (score > 0) {
          possibleMatches.push({
            file,
            req,
            score,
          });
        }
      });
    });

    possibleMatches.sort(
      (a, b) => b.score - a.score
    );

    possibleMatches.forEach(
      ({ file, req, score }) => {
        if (score < 20) return;

        if (usedFileIds.has(file.id))
          return;

        if (
          usedRequirementIds.has(req.id)
        )
          return;

        // Don't use a duplicate copy if
        // another identical file is already used.
        const duplicateAlreadyUsed =
          isDuplicate(file.id) &&
          [...usedFileIds].some(
            (usedId) => {
              const usedFile =
                files.find(
                  (item) =>
                    item.id === usedId
                );

              return (
                usedFile &&
                usedFile.hash === file.hash
              );
            }
          );

        if (duplicateAlreadyUsed)
          return;

        newMatches[req.id] = file.id;

        usedFileIds.add(file.id);
        usedRequirementIds.add(req.id);
      }
    );

    setMatches(newMatches);

    // Remove expiry dates for unmatched requirements
    setExpiryDates((previous) => {
      const updated = {};

      Object.keys(newMatches).forEach(
        (reqId) => {
          if (previous[reqId]) {
            updated[reqId] =
              previous[reqId];
          }
        }
      );

      return updated;
    });
  }

  // -----------------------------
  // MATCH FILE
  // -----------------------------
  function matchFile(
    requirementId,
    fileId
  ) {
    if (fileId) {
      const selectedFile =
        files.find(
          (item) =>
            item.id === fileId
        );

      if (selectedFile) {
        const duplicateAlreadyUsed =
          isDuplicate(fileId) &&
          Object.keys(matches).some(
            (reqId) => {
              if (
                reqId === requirementId
              ) {
                return false;
              }

              const matchedFileId =
                matches[reqId];

              const matchedFile =
                files.find(
                  (file) =>
                    file.id ===
                    matchedFileId
                );

              return (
                matchedFile &&
                matchedFile.hash ===
                  selectedFile.hash
              );
            }
          );

        if (duplicateAlreadyUsed) {
          alert(
            "This file has the same content as a file already matched to another requirement."
          );

          return;
        }
      }
    }

    setMatches((previous) => {
      const updated = {
        ...previous,
      };

      // Remove selected file from
      // any previous requirement.
      Object.keys(updated).forEach(
        (reqId) => {
          if (
            updated[reqId] === fileId
          ) {
            delete updated[reqId];
          }
        }
      );

      if (fileId) {
        updated[requirementId] =
          fileId;
      } else {
        delete updated[
          requirementId
        ];
      }

      return updated;
    });

    // Remove expiry if document is cleared
    if (!fileId) {
      setExpiryDates(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[
            requirementId
          ];

          return updated;
        }
      );
    }
  }

  // -----------------------------
  // REMOVE FILE
  // -----------------------------
  function removeFile(fileId) {
    setFiles((previous) =>
      previous.filter(
        (item) => item.id !== fileId
      )
    );

    setMatches((previous) => {
      const updated = {
        ...previous,
      };

      Object.keys(updated).forEach(
        (reqId) => {
          if (
            updated[reqId] === fileId
          ) {
            delete updated[reqId];
          }
        }
      );

      return updated;
    });
  }

  // -----------------------------
  // STATUS
  // -----------------------------
  function getStatus(requirement) {
    const fileId =
      matches[requirement.id];

    if (!fileId) {
      return requirement.mandatory
        ? "Missing"
        : "Not provided";
    }

    if (requirement.has_expiry) {
      const expiryDate =
        expiryDates[
          requirement.id
        ];

      if (!expiryDate) {
        return "Expiry date needed";
      }

      if (
        tender &&
        expiryDate <
          tender.submission_deadline
      ) {
        return "Expired";
      }
    }

    return "OK";
  }

  // -----------------------------
  // STATUS CLASS
  // -----------------------------
  function getStatusClass(status) {
    if (status === "OK")
      return "ok";

    if (status === "Not provided")
      return "not-provided";

    if (
      status === "Expiry date needed"
    )
      return "expiry-needed";

    if (status === "Expired")
      return "expired";

    return "missing";
  }

  // -----------------------------
  // DOCUMENT TITLE
  // -----------------------------
  function getDocumentTitle(req) {
    if (language === "bn") {
      return (
        req.title_bn ||
        req.title_en
      );
    }

    return req.title_en;
  }

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div>
          <h1>{t.title}</h1>

          <p>{t.subtitle}</p>
        </div>

        <button
          className="language-btn"
          onClick={() =>
            setLanguage(
              language === "en"
                ? "bn"
                : "en"
            )
          }
        >
          {t.bengali}
        </button>

      </header>

      <main>

        {/* REQUIREMENTS */}
        <section className="card">

          <div className="section-title">

            <div>
              <span className="step">
                01
              </span>

              <div>
                <h2>
                  {t.tenderRequirements}
                </h2>

                <p>
                  {t.loadRequirements}
                </p>
              </div>
            </div>

          </div>

          <label className="upload-area">

            <input
              type="file"
              accept=".json,application/json"
              onChange={
                loadRequirements
              }
            />

            <div className="upload-icon">
              ↑
            </div>

            <strong>
              {t.chooseRequirements}
            </strong>

            <span>
              {t.clickLoad}
            </span>

          </label>

        </section>

        {/* TENDER INFORMATION */}
        {tender && (
          <section className="card">

            <div className="section-heading">

              <div>
                <h2>
                  {t.tenderInformation}
                </h2>
              </div>

            </div>

            <div className="tender-grid">

              <div>
                <label>
                  {t.tenderId}
                </label>

                <strong>
                  {tender.tender_id}
                </strong>
              </div>

              <div>
                <label>
                  {t.deadline}
                </label>

                <strong>
                  {
                    tender.submission_deadline
                  }
                </strong>
              </div>

              <div>
                <label>
                  {t.tenderTitle}
                </label>

                <strong>
                  {tender.title}
                </strong>
              </div>

              <div>
                <label>
                  {t.procuringEntity}
                </label>

                <strong>
                  {
                    tender.procuring_entity
                  }
                </strong>
              </div>

              <div>
                <label>
                  {t.bidder}
                </label>

                <strong>
                  {tender.bidder}
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* PDF UPLOAD */}
        <section className="card">

          <div className="section-heading">

            <div>
              <h2>
                {t.uploadDocuments}
              </h2>

              <p>
                {t.uploadDescription}
              </p>
            </div>

            {files.length > 0 && (
              <span className="count">
                {files.length} {t.files}
              </span>
            )}

          </div>

          <label className="upload-area">

            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={
                handlePdfUpload
              }
            />

            <div className="upload-icon">
              ↑
            </div>

            <strong>
              {t.choosePdf}
            </strong>

            <span>
              {t.multiplePdf}
            </span>

          </label>

          {/* FILE LIST */}
          {files.length > 0 && (

            <div className="file-list">

              {files.map((item) => {

                const matchedRequirement =
                  Object.keys(
                    matches
                  ).find(
                    (reqId) =>
                      matches[reqId] ===
                      item.id
                  );

                const matchedDocument =
                  requirements.find(
                    (req) =>
                      req.id ===
                      matchedRequirement
                  );

                const duplicate =
                  isDuplicate(
                    item.id
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

                      {duplicate && (
                        <span className="duplicate-warning">
                          {t.duplicate}
                        </span>
                      )}

                      <span>
                        {item.pages}{" "}
                        {item.pages === 1
                          ? t.page
                          : t.pages}

                        {" • "}

                        {(
                          item.size /
                          1024 /
                          1024
                        ).toFixed(2)}

                        {" MB"}
                      </span>

                    </div>

                    <div className="file-match">

                      {matchedDocument ? (
                        <span className="matched">
                          {t.matched}:{" "}
                          {getDocumentTitle(
                            matchedDocument
                          )}
                        </span>
                      ) : (
                        <span className="unmatched">
                          {t.notMatched}
                        </span>
                      )}

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeFile(
                            item.id
                          )
                        }
                      >
                        {t.remove}
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
                <h2>
                  {t.documentChecklist}
                </h2>

                <p>
                  {t.checklistDescription}
                </p>
              </div>

              {files.length > 0 && (
                <button
                  className="auto-match-btn"
                  onClick={
                    autoMatchDocuments
                  }
                >
                  ⚡ {t.autoMatch}
                </button>
              )}

            </div>

            <p className="auto-match-info">
              {t.autoMatchInfo}
            </p>

            <div className="requirements">

              {requirements.map(
                (req) => {

                  const status =
                    getStatus(req);

                  const selectedFile =
                    matches[
                      req.id
                    ] || "";

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
                          {getDocumentTitle(
                            req
                          )}
                        </strong>

                        <span>
                          {req.mandatory
                            ? t.mandatory
                            : t.optional}

                          {req.has_expiry &&
                            ` • ${t.expiryRequired}`}
                        </span>

                      </div>

                      <select
                        value={
                          selectedFile
                        }
                        onChange={(e) =>
                          matchFile(
                            req.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          {t.selectPdf}
                        </option>

                        {files.map(
                          (item) => {

                            const duplicate =
                              isDuplicate(
                                item.id
                              );

                            const usedByAnotherRequirement =
                              Object.keys(
                                matches
                              ).some(
                                (reqId) =>
                                  reqId !==
                                    req.id &&
                                  matches[
                                    reqId
                                  ] ===
                                    item.id
                              );

                            const duplicateUsedByAnotherRequirement =
                              duplicate &&
                              Object.keys(
                                matches
                              ).some(
                                (reqId) => {

                                  if (
                                    reqId ===
                                    req.id
                                  ) {
                                    return false;
                                  }

                                  const matchedFileId =
                                    matches[
                                      reqId
                                    ];

                                  const matchedFile =
                                    files.find(
                                      (
                                        file
                                      ) =>
                                        file.id ===
                                        matchedFileId
                                    );

                                  return (
                                    matchedFile &&
                                    matchedFile.hash ===
                                      item.hash
                                  );
                                }
                              );

                            return (
                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                                disabled={
                                  usedByAnotherRequirement ||
                                  duplicateUsedByAnotherRequirement
                                }
                              >
                                {item.name}
                                {" "}
                                (
                                {
                                  item.pages
                                }{" "}
                                {t.pages}
                                )

                                {duplicate
                                  ? ` — ${t.duplicate}`
                                  : ""}

                                {usedByAnotherRequirement
                                  ? ` — ${t.alreadyUsed}`
                                  : ""}

                                {duplicateUsedByAnotherRequirement
                                  ? ` — ${t.duplicateUsed}`
                                  : ""}
                              </option>
                            );
                          }
                        )}

                      </select>

                      {/* EXPIRY DATE */}
                      {selectedFile &&
                        req.has_expiry && (

                          <input
                            type="date"
                            value={
                              expiryDates[
                                req.id
                              ] || ""
                            }
                            onChange={(e) =>
                              setExpiryDates(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [req.id]:
                                    e.target
                                      .value,
                                })
                              )
                            }
                          />

                        )}

                      <div
                        className={`status ${getStatusClass(
                          status
                        )}`}
                      >
                        {status ===
                        "Missing"
                          ? t.missing
                          : status ===
                            "Not provided"
                          ? t.notProvided
                          : status ===
                            "Expiry date needed"
                          ? t.expiryNeeded
                          : status ===
                            "Expired"
                          ? t.expired
                          : t.ok}
                      </div>

                    </div>

                  );
                }
              )}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;