import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function App() {
  const [tender, setTender] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState({});
  const [expiryDates, setExpiryDates] = useState({});
  const [language, setLanguage] = useState("en");
  const [generating, setGenerating] = useState(false);

  const text = {
    en: {
      title: "Tender Document Package Builder",
      language: "বাংলা",
      loadRequirements: "Load requirements.json",
      tenderDetails: "Tender Details",
      tenderId: "Tender ID",
      tenderTitle: "Tender Title",
      procuringEntity: "Procuring Entity",
      bidder: "Bidder",
      deadline: "Submission Deadline",
      uploadPdfs: "Upload PDF Documents",
      choosePdfs: "Choose PDF files",
      files: "Uploaded Files",
      noFiles: "No PDF files uploaded yet.",
      pages: "pages",
      duplicate: "Duplicate content",
      matched: "Matched",
      unmatched: "Unmatched",
      remove: "Remove",
      checklist: "Document Checklist",
      autoMatch: "Auto Match Documents",
      status: "Status",
      document: "Document",
      expiryDate: "Expiry Date",
      selectFile: "Select file",
      generate: "Generate Package PDF",
      blockingIssues: "blocking issue(s)",
      ready: "Ready to generate",
      missing: "Missing",
      expiryNeeded: "Expiry date needed",
      expired: "Expired",
      notProvided: "Not provided",
      ok: "OK",
      packageSuccess: "Package PDF generated successfully.",
      packageError: "Could not generate the package PDF.",
      fixIssues: "Fix the blocking issues before generating the package.",
      generating: "Generating package...",
      required: "Required",
      optional: "Optional",
      expiryRequired: "Expiry required",
      noBlockingIssues: "All required documents are ready.",
    },

    bn: {
      title: "টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার",
      language: "English",
      loadRequirements: "requirements.json লোড করুন",
      tenderDetails: "টেন্ডারের তথ্য",
      tenderId: "টেন্ডার আইডি",
      tenderTitle: "টেন্ডারের শিরোনাম",
      procuringEntity: "প্রকিউরিং এন্টিটি",
      bidder: "বিডার",
      deadline: "জমাদানের শেষ তারিখ",
      uploadPdfs: "PDF ডকুমেন্ট আপলোড",
      choosePdfs: "PDF ফাইল নির্বাচন করুন",
      files: "আপলোড করা ফাইল",
      noFiles: "এখনও কোনো PDF আপলোড করা হয়নি।",
      pages: "পৃষ্ঠা",
      duplicate: "একই কনটেন্ট",
      matched: "ম্যাচ করা হয়েছে",
      unmatched: "ম্যাচ করা হয়নি",
      remove: "মুছে ফেলুন",
      checklist: "ডকুমেন্ট চেকলিস্ট",
      autoMatch: "অটো ম্যাচ করুন",
      status: "স্ট্যাটাস",
      document: "ডকুমেন্ট",
      expiryDate: "মেয়াদ শেষের তারিখ",
      selectFile: "ফাইল নির্বাচন করুন",
      generate: "প্যাকেজ PDF তৈরি করুন",
      blockingIssues: "টি সমস্যা রয়েছে",
      ready: "তৈরি করার জন্য প্রস্তুত",
      missing: "অনুপস্থিত",
      expiryNeeded: "মেয়াদ শেষের তারিখ প্রয়োজন",
      expired: "মেয়াদ শেষ",
      notProvided: "দেওয়া হয়নি",
      ok: "ঠিক আছে",
      packageSuccess: "প্যাকেজ PDF সফলভাবে তৈরি হয়েছে।",
      packageError: "প্যাকেজ PDF তৈরি করা যায়নি।",
      fixIssues: "প্যাকেজ তৈরি করার আগে সমস্যাগুলো ঠিক করুন।",
      generating: "প্যাকেজ তৈরি হচ্ছে...",
      required: "প্রয়োজনীয়",
      optional: "ঐচ্ছিক",
      expiryRequired: "মেয়াদ প্রয়োজন",
      noBlockingIssues: "সব প্রয়োজনীয় ডকুমেন্ট প্রস্তুত।",
    },
  };

  const t = text[language];

  function loadRequirements(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        const loadedRequirements = Array.isArray(data.requirements)
          ? [...data.requirements].sort(
              (a, b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
            )
          : [];

        setTender(data);
        setRequirements(loadedRequirements);
        setMatches({});
        setExpiryDates({});
      } catch (error) {
        console.error(error);
        alert("Invalid requirements.json file.");
      }
    };

    reader.readAsText(file);
  }

  async function getFileHash(file) {
    const buffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

    const hashArray = Array.from(
      new Uint8Array(hashBuffer)
    );

    return hashArray
      .map((byte) =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");
  }

  async function getPageCount(file) {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    return pdf.numPages;
  }

  async function handlePdfUpload(event) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) return;

    const newFiles = [];

    for (const file of selectedFiles) {
      if (file.type !== "application/pdf") {
        alert(`${file.name} is not a PDF file.`);
        continue;
      }

      try {
        const pages = await getPageCount(file);
        const hash = await getFileHash(file);

        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          pages,
          hash,
        });
      } catch (error) {
        console.error(error);
        alert(`Could not read ${file.name}.`);
      }
    }

    setFiles((previous) => [
      ...previous,
      ...newFiles,
    ]);

    event.target.value = "";
  }

  function isDuplicate(fileId) {
    const target = files.find(
      (file) => file.id === fileId
    );

    if (!target) return false;

    return files.some(
      (file) =>
        file.id !== fileId &&
        file.hash === target.hash
    );
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\.pdf$/i, "")
      .replace(/[_\-()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function calculateMatchScore(file, requirement) {
    const fileName = normalizeText(file.name);

    const titleEn = normalizeText(
      requirement.title_en
    );

    const titleBn = normalizeText(
      requirement.title_bn
    );

    let score = 0;

    if (titleEn && fileName.includes(titleEn)) {
      score += 100;
    }

    if (titleBn && fileName.includes(titleBn)) {
      score += 100;
    }

    const keywordGroups = [
      ["financial", "financial proposal", "finance"],
      ["technical", "technical proposal"],
      ["tin", "tin certificate"],
      ["vat", "vat certificate"],
      ["bank", "solvency", "bank solvency"],
      ["experience", "experience certificate", "experience cert"],
      ["trade", "trade license", "trade licence"],
    ];

    for (const group of keywordGroups) {
      const fileMatches = group.some(
        (keyword) => fileName.includes(keyword)
      );

      const requirementMatches =
        group.some((keyword) =>
          titleEn.includes(keyword)
        ) ||
        group.some((keyword) =>
          titleBn.includes(keyword)
        );

      if (fileMatches && requirementMatches) {
        score += 50;
      }
    }

    const fileWords = fileName.split(" ");

    for (const word of fileWords) {
      if (word.length < 3) continue;

      if (
        titleEn.includes(word) ||
        titleBn.includes(word)
      ) {
        score += 5;
      }
    }

    return score;
  }

  function autoMatchDocuments() {
    if (!requirements.length || !files.length) {
      return;
    }

    const newMatches = {};
    const usedFiles = new Set();

    const sortedRequirements = [...requirements].sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

    for (const requirement of sortedRequirements) {
      let bestFile = null;
      let bestScore = 0;

      for (const file of files) {
        if (usedFiles.has(file.id)) continue;

        const duplicateAlreadyUsed =
          files.some(
            (otherFile) =>
              otherFile.id !== file.id &&
              otherFile.hash === file.hash &&
              usedFiles.has(otherFile.id)
          );

        if (duplicateAlreadyUsed) continue;

        const score = calculateMatchScore(
          file,
          requirement
        );

        if (score > bestScore) {
          bestScore = score;
          bestFile = file;
        }
      }

      if (bestFile && bestScore > 0) {
        newMatches[requirement.id] = bestFile.id;
        usedFiles.add(bestFile.id);
      }
    }

    setMatches(newMatches);
  }

  function matchFile(requirementId, fileId) {
    if (!fileId) {
      setMatches((previous) => {
        const updated = { ...previous };
        delete updated[requirementId];
        return updated;
      });

      setExpiryDates((previous) => {
        const updated = { ...previous };
        delete updated[requirementId];
        return updated;
      });

      return;
    }

    const selectedFile = files.find(
      (file) => file.id === fileId
    );

    if (!selectedFile) return;

    const alreadyUsedByAnotherRequirement =
      Object.entries(matches).some(
        ([reqId, matchedFileId]) =>
          reqId !== requirementId &&
          matchedFileId === fileId
      );

    if (alreadyUsedByAnotherRequirement) {
      alert(
        "This file is already matched to another requirement."
      );
      return;
    }

    const duplicateUsedElsewhere =
      Object.entries(matches).some(
        ([reqId, matchedFileId]) => {
          if (reqId === requirementId) return false;

          const otherFile = files.find(
            (file) => file.id === matchedFileId
          );

          return (
            otherFile &&
            otherFile.hash === selectedFile.hash
          );
        }
      );

    if (duplicateUsedElsewhere) {
      alert(
        "An identical copy of this PDF is already matched to another requirement."
      );
      return;
    }

    setMatches((previous) => ({
      ...previous,
      [requirementId]: fileId,
    }));
  }

  function removeFile(fileId) {
    setFiles((previous) =>
      previous.filter(
        (file) => file.id !== fileId
      )
    );

    setMatches((previous) => {
      const updated = { ...previous };

      for (const requirementId of Object.keys(updated)) {
        if (updated[requirementId] === fileId) {
          delete updated[requirementId];
        }
      }

      return updated;
    });
  }

  function getStatus(requirement) {
    const fileId = matches[requirement.id];

    if (!fileId) {
      return requirement.mandatory
        ? "Missing"
        : "Not provided";
    }

    if (requirement.has_expiry) {
      const expiryDate =
        expiryDates[requirement.id];

      if (!expiryDate) {
        return "Expiry date needed";
      }

      const deadlineDate =
        tender?.submission_deadline?.slice(0, 10);

      if (
        deadlineDate &&
        expiryDate < deadlineDate
      ) {
        return "Expired";
      }
    }

    return "OK";
  }

  function getStatusClass(status) {
    switch (status) {
      case "OK":
        return "status-ok";

      case "Not provided":
        return "status-not-provided";

      case "Expiry date needed":
        return "status-expiry";

      case "Expired":
        return "status-expired";

      default:
        return "status-missing";
    }
  }

  function hasBlockingIssues() {
    return requirements.some((req) => {
      const status = getStatus(req);

      return (
        status === "Missing" ||
        status === "Expiry date needed" ||
        status === "Expired"
      );
    });
  }

  function getBlockingRequirements() {
    return requirements.filter((req) => {
      const status = getStatus(req);

      return (
        status === "Missing" ||
        status === "Expiry date needed" ||
        status === "Expired"
      );
    });
  }

  function getDocumentTitle(requirement) {
    if (language === "bn") {
      return (
        requirement.title_bn ||
        requirement.title_en ||
        requirement.id
      );
    }

    return (
      requirement.title_en ||
      requirement.title_bn ||
      requirement.id
    );
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString();
  }

  async function generatePackage() {
    if (!tender) {
      alert(
        "Please load requirements.json first."
      );
      return;
    }

    if (hasBlockingIssues()) {
      alert(t.fixIssues);
      return;
    }

    setGenerating(true);

    try {
      const outputPdf =
        await PDFDocument.create();

      const regularFont =
        await outputPdf.embedFont(
          StandardFonts.Helvetica
        );

      const boldFont =
        await outputPdf.embedFont(
          StandardFonts.HelveticaBold
        );

      const footerHeight = 30;

      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      const coverPage =
        outputPdf.addPage([
          A4_WIDTH,
          A4_HEIGHT,
        ]);

      const {
        width: coverWidth,
        height: coverHeight,
      } = coverPage.getSize();

      let y = coverHeight - 70;

      coverPage.drawText(
        "Tender Document Package",
        {
          x: 50,
          y,
          size: 22,
          font: boldFont,
          color: rgb(
            0.08,
            0.15,
            0.25
          ),
        }
      );

      y -= 45;

      coverPage.drawText(
        String(tender.tender_id || "-"),
        {
          x: 50,
          y,
          size: 16,
          font: boldFont,
        }
      );

      y -= 35;

      const tenderTitle =
        tender.title ||
        tender.title_en ||
        tender.tender_title ||
        "-";

      coverPage.drawText(
        String(tenderTitle),
        {
          x: 50,
          y,
          size: 13,
          font: regularFont,
          maxWidth: coverWidth - 100,
        }
      );

      y -= 45;

      const details = [
        [
          "Procuring Entity",
          tender.procuring_entity ||
            tender.procuringEntity ||
            "-",
        ],
        [
          "Bidder",
          tender.bidder ||
            tender.bidder_name ||
            "-",
        ],
        [
          "Submission Deadline",
          formatDate(
            tender.submission_deadline
          ),
        ],
        [
          "Package Made",
          new Date().toLocaleDateString(),
        ],
      ];

      for (const [label, value] of details) {
        coverPage.drawText(
          `${label}:`,
          {
            x: 50,
            y,
            size: 10,
            font: boldFont,
          }
        );

        coverPage.drawText(
          String(value),
          {
            x: 180,
            y,
            size: 10,
            font: regularFont,
            maxWidth: coverWidth - 230,
          }
        );

        y -= 23;
      }

      y -= 20;

      coverPage.drawText(
        "Included Documents",
        {
          x: 50,
          y,
          size: 14,
          font: boldFont,
        }
      );

      y -= 28;

      const includedRequirements =
        requirements.filter(
          (requirement) =>
            matches[requirement.id]
        );

      for (
        let index = 0;
        index < includedRequirements.length;
        index++
      ) {
        const requirement =
          includedRequirements[index];

        const fileId =
          matches[requirement.id];

        const file = files.find(
          (item) => item.id === fileId
        );

        const line =
          `${index + 1}. ${getDocumentTitle(
            requirement
          )} — ${file?.name || "-"}`;

        if (y < 70) break;

        coverPage.drawText(
          line,
          {
            x: 55,
            y,
            size: 9,
            font: regularFont,
            maxWidth: coverWidth - 105,
          }
        );

        y -= 19;
      }

      for (const requirement of requirements) {
        const fileId =
          matches[requirement.id];

        if (!fileId) continue;

        const matchedFile =
          files.find(
            (file) =>
              file.id === fileId
          );

        if (!matchedFile) continue;

        const sourceBytes =
          await matchedFile.file.arrayBuffer();

        const sourcePdf =
          await PDFDocument.load(
            sourceBytes
          );

        const sourcePageCount =
          sourcePdf.getPageCount();

        for (
          let pageIndex = 0;
          pageIndex < sourcePageCount;
          pageIndex++
        ) {
          const sourcePage =
            sourcePdf.getPage(
              pageIndex
            );

          const {
            width,
            height,
          } = sourcePage.getSize();

          const outputPage =
            outputPdf.addPage([
              width,
              height + footerHeight,
            ]);

          const embeddedPage =
            await outputPdf.embedPage(
              sourcePage
            );

          outputPage.drawPage(
            embeddedPage,
            {
              x: 0,
              y: footerHeight,
              width,
              height,
            }
          );
        }
      }

      const totalPages =
        outputPdf.getPageCount();

      const outputPages =
        outputPdf.getPages();

      outputPages.forEach(
        (page, index) => {
          const { width } =
            page.getSize();

          const footerText =
            `${tender.tender_id || "Tender"} | Page ${
              index + 1
            } of ${totalPages}`;

          const footerSize = 8;

          const footerWidth =
            regularFont.widthOfTextAtSize(
              footerText,
              footerSize
            );

          page.drawText(
            footerText,
            {
              x:
                (width -
                  footerWidth) /
                2,
              y: 10,
              size: footerSize,
              font: regularFont,
              color: rgb(
                0.35,
                0.35,
                0.35
              ),
            }
          );
        }
      );

      const pdfBytes =
        await outputPdf.save();

      const blob =
        new Blob(
          [pdfBytes],
          {
            type: "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        `${
          tender.tender_id ||
          "Tender"
        }_Package.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);

      alert(t.packageSuccess);
    } catch (error) {
      console.error(
        "Package generation error:",
        error
      );

      alert(t.packageError);
    } finally {
      setGenerating(false);
    }
  }

  const blockingRequirements =
    getBlockingRequirements();

  const blockingCount =
    blockingRequirements.length;

  return (
    <div className="app">

      {/* TOP BAR */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            TP
          </div>

          <div>
            <div className="brand-name">
              TENDER PACKAGE
            </div>

            <div className="brand-subtitle">
              DOCUMENT BUILDER
            </div>
          </div>

        </div>

        <div className="topbar-right">

          <div className="system-status">
            <span className="status-dot"></span>
            BROWSER READY
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
            {t.language}
          </button>

        </div>

      </header>


      <main className="workspace">

        {/* INTRO */}

        <div className="page-intro">

          <div>

            <div className="eyebrow">
              AI DEVFEST / PROCUREMENT TOOL
            </div>

            <h1>
              Tender Package
              <br />
              <span>Builder</span>
            </h1>

            <p>
              Assemble, validate and generate a
              submission-ready document package.
            </p>

          </div>

          {tender && (
            <div className="tender-chip">

              <span>TENDER</span>

              <strong>
                {tender.tender_id || "—"}
              </strong>

            </div>
          )}

        </div>


        {/* PROGRESS */}

        <section className="setup-strip">

          <div className="setup-step active">

            <span className="step-number">
              01
            </span>

            <div>
              <strong>
                REQUIREMENTS
              </strong>

              <small>
                Load tender specification
              </small>
            </div>

          </div>

          <div className="setup-line"></div>

          <div
            className={`setup-step ${
              files.length ? "active" : ""
            }`}
          >

            <span className="step-number">
              02
            </span>

            <div>
              <strong>
                DOCUMENTS
              </strong>

              <small>
                {files.length
                  ? `${files.length} PDF${
                      files.length > 1
                        ? "s"
                        : ""
                    } loaded`
                  : "Upload source PDFs"}
              </small>
            </div>

          </div>

          <div className="setup-line"></div>

          <div
            className={`setup-step ${
              tender &&
              requirements.length &&
              !hasBlockingIssues()
                ? "active"
                : ""
            }`}
          >

            <span className="step-number">
              03
            </span>

            <div>
              <strong>
                PACKAGE
              </strong>

              <small>
                {hasBlockingIssues()
                  ? "Validation required"
                  : "Ready to generate"}
              </small>
            </div>

          </div>

        </section>


        {/* REQUIREMENTS */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <div className="panel-index">
                INPUT / 01
              </div>

              <h2>
                Tender specification
              </h2>

              <p>
                Load the requirements file
                supplied with the tender.
              </p>

            </div>

            <label className="file-button">

              <span>+</span>

              {t.loadRequirements}

              <input
                type="file"
                accept=".json,application/json"
                onChange={
                  loadRequirements
                }
              />

            </label>

          </div>


          {tender ? (
            <div className="tender-data">

              <div className="data-cell">
                <span>TENDER ID</span>

                <strong>
                  {tender.tender_id || "—"}
                </strong>
              </div>

              <div className="data-cell wide">
                <span>TITLE</span>

                <strong>
                  {tender.title ||
                    tender.title_en ||
                    tender.tender_title ||
                    "—"}
                </strong>
              </div>

              <div className="data-cell">
                <span>
                  PROCURING ENTITY
                </span>

                <strong>
                  {tender.procuring_entity ||
                    tender.procuringEntity ||
                    "—"}
                </strong>
              </div>

              <div className="data-cell">
                <span>BIDDER</span>

                <strong>
                  {tender.bidder ||
                    tender.bidder_name ||
                    "—"}
                </strong>
              </div>

              <div className="data-cell">
                <span>
                  SUBMISSION DEADLINE
                </span>

                <strong>
                  {formatDate(
                    tender.submission_deadline
                  )}
                </strong>
              </div>

            </div>
          ) : (
            <div className="empty-panel">

              <span className="empty-icon">
                01
              </span>

              <div>
                <strong>
                  No tender loaded
                </strong>

                <p>
                  Select the requirements.json
                  file to begin.
                </p>
              </div>

            </div>
          )}

        </section>


        {/* DOCUMENTS */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <div className="panel-index">
                INPUT / 02
              </div>

              <h2>
                Source documents
              </h2>

              <p>
                Upload the PDFs that belong to
                this tender package.
              </p>

            </div>

            <div className="document-count">

              <strong>
                {String(files.length).padStart(
                  2,
                  "0"
                )}
              </strong>

              <span>
                FILES
              </span>

            </div>

          </div>


          <label className="drop-zone">

            <div className="upload-symbol">
              ↑
            </div>

            <div>

              <strong>
                Add PDF documents
              </strong>

              <p>
                Click to browse your files
              </p>

            </div>

            <span className="drop-hint">
              PDF ONLY
            </span>

            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={
                handlePdfUpload
              }
            />

          </label>


          {files.length > 0 && (
            <div className="file-table">

              <div className="file-table-head">

                <span>
                  DOCUMENT
                </span>

                <span>
                  PAGES
                </span>

                <span>
                  STATE
                </span>

                <span></span>

              </div>

              {files.map(
                (file, index) => {

                  const matched =
                    Object.values(
                      matches
                    ).includes(
                      file.id
                    );

                  return (
                    <div
                      className="file-row"
                      key={file.id}
                    >

                      <div className="file-name">

                        <span className="file-number">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div>

                          <strong>
                            {file.name}
                          </strong>

                          {isDuplicate(
                            file.id
                          ) && (
                            <small className="duplicate">
                              DUPLICATE CONTENT
                            </small>
                          )}

                        </div>

                      </div>

                      <span className="file-pages">
                        {file.pages}
                      </span>

                      <span
                        className={
                          matched
                            ? "file-state matched"
                            : "file-state"
                        }
                      >
                        {matched
                          ? "MATCHED"
                          : "UNASSIGNED"}
                      </span>

                      <button
                        className="remove-file"
                        onClick={() =>
                          removeFile(
                            file.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>


        {/* CHECKLIST */}

        {requirements.length > 0 && (
          <section className="panel checklist-panel">

            <div className="checklist-top">

              <div>

                <div className="panel-index">
                  VALIDATION / 03
                </div>

                <h2>
                  Document checklist
                </h2>

                <p>
                  Match every requirement to
                  its corresponding PDF.
                </p>

              </div>

              <div className="checklist-actions">

                <div
                  className={
                    blockingCount === 0
                      ? "validation ready"
                      : "validation blocked"
                  }
                >

                  <span></span>

                  {blockingCount === 0
                    ? "PACKAGE READY"
                    : `${blockingCount} BLOCKING`}

                </div>

                <button
                  className="auto-match-btn"
                  onClick={
                    autoMatchDocuments
                  }
                  disabled={
                    files.length === 0
                  }
                >
                  AUTO-MATCH
                  <span>↗</span>
                </button>

              </div>

            </div>


            {/* VALIDATION ALERT */}

            {blockingCount > 0 && (
              <div className="validation-alert">

                <div className="alert-icon">
                  !
                </div>

                <div>

                  <strong>
                    Package cannot be generated
                  </strong>

                  <p>
                    Resolve the following
                    requirements before export.
                  </p>

                  <div className="alert-list">

                    {blockingRequirements.map(
                      (requirement) => (
                        <span
                          key={
                            requirement.id
                          }
                        >

                          {getDocumentTitle(
                            requirement
                          )}

                          <b>
                            {getStatus(
                              requirement
                            )}
                          </b>

                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}


            {/* REQUIREMENTS */}

            <div className="requirements-table">

              <div className="requirements-head">

                <span>#</span>
                <span>REQUIREMENT</span>
                <span>DOCUMENT</span>
                <span>EXPIRY</span>
                <span>STATUS</span>

              </div>

              {requirements.map(
                (requirement) => {

                  const status =
                    getStatus(
                      requirement
                    );

                  const selectedFileId =
                    matches[
                      requirement.id
                    ];

                  return (
                    <div
                      className={`requirement-row ${
                        status === "OK"
                          ? "is-ok"
                          : "is-blocked"
                      }`}
                      key={
                        requirement.id
                      }
                    >

                      <span className="req-number">
                        {String(
                          requirement.order
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>


                      <div className="req-title">

                        <strong>
                          {getDocumentTitle(
                            requirement
                          )}
                        </strong>

                        <div>

                          {requirement.mandatory ? (
                            <span className="tag required-tag">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="tag optional-tag">
                              OPTIONAL
                            </span>
                          )}

                          {requirement.has_expiry && (
                            <span className="tag expiry-tag">
                              EXPIRY
                            </span>
                          )}

                        </div>

                      </div>


                      <select
                        className="file-select"
                        value={
                          selectedFileId || ""
                        }
                        onChange={(
                          event
                        ) =>
                          matchFile(
                            requirement.id,
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          — Select document —
                        </option>

                        {files.map(
                          (file) => {

                            const usedByOther =
                              Object.entries(
                                matches
                              ).some(
                                ([
                                  reqId,
                                  matchedId,
                                ]) =>
                                  reqId !==
                                    requirement.id &&
                                  matchedId ===
                                    file.id
                              );

                            return (
                              <option
                                key={
                                  file.id
                                }
                                value={
                                  file.id
                                }
                                disabled={
                                  usedByOther
                                }
                              >
                                {file.name}
                                {isDuplicate(
                                  file.id
                                )
                                  ? " — duplicate"
                                  : ""}
                              </option>
                            );
                          }
                        )}

                      </select>


                      <div className="expiry-cell">

                        {requirement.has_expiry &&
                        selectedFileId ? (
                          <input
                            type="date"
                            value={
                              expiryDates[
                                requirement.id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              setExpiryDates(
                                (previous) => ({
                                  ...previous,
                                  [requirement.id]:
                                    event.target
                                      .value,
                                })
                              )
                            }
                          />
                        ) : (
                          <span className="dash">
                            —
                          </span>
                        )}

                      </div>


                      <span
                        className={`table-status ${getStatusClass(
                          status
                        )}`}
                      >

                        <i></i>

                        {status === "OK"
                          ? "READY"
                          : status ===
                            "Not provided"
                          ? "OPTIONAL"
                          : status ===
                            "Expiry date needed"
                          ? "EXPIRY NEEDED"
                          : status ===
                            "Expired"
                          ? "EXPIRED"
                          : "MISSING"}

                      </span>

                    </div>
                  );
                }
              )}

            </div>


            {/* EXPORT */}

            <div className="export-bar">

              <div>

                <span className="export-label">
                  FINAL OUTPUT
                </span>

                <strong>
                  {tender?.tender_id ||
                    "Tender"}
                  _Package.pdf
                </strong>

              </div>

              <button
                className="generate-btn"
                disabled={
                  hasBlockingIssues() ||
                  generating ||
                  !tender ||
                  requirements.length === 0
                }
                onClick={
                  generatePackage
                }
              >

                {generating
                  ? t.generating
                  : "GENERATE PACKAGE"}

                <span>
                  →
                </span>

              </button>

            </div>

          </section>
        )}

      </main>


      <footer className="app-footer">

        <span>
          TENDER PACKAGE BUILDER
        </span>

        <span>
          AI DEVFEST 2026
        </span>

        <span>
          PDF / VALIDATION / EXPORT
        </span>

      </footer>

    </div>
  );
}

export default App;