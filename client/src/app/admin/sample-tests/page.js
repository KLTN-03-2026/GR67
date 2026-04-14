"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import ConfirmModal from "../../components/ConfirmModal";
import InputField from "../../components/InputField";
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiChevronDown, FiChevronUp, FiUpload } from "react-icons/fi";
import { formatDateDdMmYyyy } from "../../../lib/dateFormat";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function Modal({ isOpen, title, onClose, children, footer, maxWidthClassName = "max-w-3xl" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`w-full ${maxWidthClassName} bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden`}>
        <div className="px-6 py-5 border-b dark:border-gray-700 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
        {footer ? <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Kéo thả hoặc bấm để chọn file — onPickFiles nhận mảng File */
function FileDropZone({ disabled = false, multiple = false, accept, onPickFiles, title, hint }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const handleList = useCallback(
    (fileList) => {
      if (disabled || !fileList?.length) return;
      const arr = Array.from(fileList);
      onPickFiles(multiple ? arr : arr.slice(0, 1));
    },
    [disabled, multiple, onPickFiles]
  );

  const zoneClass = [
    "rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800",
    disabled
      ? "cursor-not-allowed opacity-50 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/80"
      : isOver
        ? "cursor-pointer border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
        : "cursor-pointer border-gray-300 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/40 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-700/50",
  ].join(" ");

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={zoneClass}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        if (disabled) return;
        const fl = e.dataTransfer?.files;
        if (fl?.length) handleList(fl);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const fl = e.target.files;
          if (fl?.length) handleList(fl);
          e.target.value = "";
        }}
      />
      <FiUpload className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" aria-hidden />
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div> : null}
    </div>
  );
}

function looksLikeHtml(s) {
  if (!s || typeof s !== "string") return false;
  return /<[a-z][\s\S]*>/i.test(s);
}

/** Ảnh trong HTML: nhỏ gọn trong khung nhưng vẫn xem trọn vẹn (không crop) */
const HTML_IMG_COMPACT =
  "[&_img]:max-w-[min(100%,260px)] [&_img]:max-h-48 [&_img]:w-auto [&_img]:h-auto [&_img]:object-contain [&_img]:rounded-sm [&_img]:align-middle";

/** Khối minh hoạ trông giống trang Word — đặt cạnh hướng dẫn import */
function WordImportVisualSample({ className = "" }) {
  const Star = () => <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">**</span>;
  const Tag = ({ children }) => (
    <code className="rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 px-1 py-0.5 text-[11px] font-mono">{children}</code>
  );
  const Note = ({ children }) => <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 italic border-l-2 border-blue-300 dark:border-blue-600 pl-2">{children}</p>;

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-600 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-600 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Mẫu trong Word</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">In đậm = câu hỏi · Đoạn thường = đáp / lựa chọn</span>
      </div>
      <div className="p-4 text-[13px] leading-relaxed text-gray-900 dark:text-gray-100 space-y-5 max-h-[min(70vh,28rem)] overflow-y-auto">
        <div>
          <div className="font-mono text-xs text-violet-600 dark:text-violet-400 mb-2">//1-2</div>
          <p className="font-bold text-gray-900 dark:text-white mb-2">1: tôi là ai</p>
          <ul className="space-y-1 list-none pl-0 font-sans text-sm">
            <li>
              <Star />
              A. Công
            </li>
            <li>
              <Star />
              B. Thạch
            </li>
            <li>C. Chiên</li>
            <li>D. Không có</li>
          </ul>
          <Note>
            Hai (hoặc nhiều) dòng có <Tag>**</Tag> trong 4 lựa chọn → hệ thống nhận là <strong>chọn nhiều</strong> (multi).
          </Note>
        </div>

        <div className="border-t border-dashed border-gray-200 dark:border-gray-600 pt-4">
          <p className="font-bold text-gray-900 dark:text-white mb-2">2. đây là ai</p>
          <div className="mb-3 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-100/80 dark:bg-gray-800/60 py-8 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Ảnh chèn trong Word (đoạn có ảnh, không in đậm) nằm giữa câu hỏi và các lựa chọn
          </div>
          <ul className="space-y-1 list-none pl-0 font-sans text-sm">
            <li>
              <Star />
              A. Công trịnh
            </li>
            <li>B. Thạch</li>
            <li>C. Chiên</li>
            <li>D. Không có</li>
          </ul>
          <Note>Một dòng có <Tag>**</Tag> trong 4 lựa chọn → <strong>MCQ</strong> (một đáp án đúng).</Note>
        </div>

        <div className="border-t border-dashed border-gray-200 dark:border-gray-600 pt-4">
          <div className="font-mono text-xs text-violet-600 dark:text-violet-400 mb-2">//3-4</div>
          <p className="font-bold text-gray-900 dark:text-white mb-2">3. điền vào chỗ trống: ab_d</p>
          <p className="font-sans text-sm pl-0">C</p>
          <Note>
            Chỉ <strong>một</strong> dòng đáp, <strong>không</strong> dùng <Tag>**</Tag> → <strong>trả lời ngắn</strong>.
          </Note>
        </div>

        <div className="border-t border-dashed border-gray-200 dark:border-gray-600 pt-4">
          <p className="font-bold text-gray-900 dark:text-white mb-2">4. Công đẹp trai đúng không</p>
          <p className="font-sans text-sm">
            <Tag>[đúng]</Tag>
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">(có thể dùng [Đ], [đ], [d] / [Sai], [S], [s])</span>
          </p>
          <Note>
            Tag ngoặc kiểu <Tag>[đúng]</Tag> trong stem hoặc dòng đáp → <strong>đúng / sai</strong> (không cần gõ <Tag>[TF]</Tag>).
          </Note>
        </div>
      </div>
    </div>
  );
}

function questionAnswerSummaryLine(form) {
  const loai = String(form.loaiCauHoi || "mcq");
  if (loai === "mcq") {
    const i = Number(form.dapAnDungIndex);
    const letter = ["A", "B", "C", "D"][Number.isInteger(i) && i >= 0 && i <= 3 ? i : -1];
    return letter ? `Đáp án đúng: ${letter}` : "Đáp án đúng: (chưa chọn hợp lệ)";
  }
  if (loai === "multiSelect") {
    const idxs = [0, 1, 2, 3].filter((i) => form.multiCorrect?.[i]);
    const letters = idxs.map((i) => ["A", "B", "C", "D"][i]).join(", ");
    return letters ? `Đáp án đúng: ${letters}` : "Đáp án đúng: (chưa chọn)";
  }
  if (loai === "trueFalse") return `Đáp án đúng: ${form.dapAnDungBoolean ? "Đúng" : "Sai"}`;
  if (loai === "shortAnswer") {
    const t = String(form.dapAnDungText || "").trim();
    return t ? `Đáp án mẫu: ${t}` : "Đáp án mẫu: (trống)";
  }
  return "";
}

/** Tóm tắt đáp án từ document API (danh sách câu trong part) */
function questionAnswerSummaryFromDoc(q) {
  if (!q) return "";
  const loai = String(q.loaiCauHoi || "mcq");
  if (loai === "mcq") {
    const i = Number(q.dapAnDungIndex);
    const letter = ["A", "B", "C", "D"][Number.isInteger(i) && i >= 0 && i <= 3 ? i : -1];
    return letter ? `Đáp án đúng: ${letter}` : "Đáp án đúng: —";
  }
  if (loai === "multiSelect") {
    const indices = Array.isArray(q.dapAnDungIndices) ? q.dapAnDungIndices.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 3) : [];
    const letters = [...new Set(indices)]
      .sort((a, b) => a - b)
      .map((i) => ["A", "B", "C", "D"][i])
      .join(", ");
    return letters ? `Đáp án đúng: ${letters}` : "Đáp án đúng: —";
  }
  if (loai === "trueFalse") return `Đáp án đúng: ${q.dapAnDungBoolean === true ? "Đúng" : "Sai"}`;
  if (loai === "shortAnswer") {
    const t = String(q.dapAnDungText || "").trim();
    return t ? `Đáp án mẫu: ${t}` : "Đáp án mẫu: —";
  }
  return "";
}

function SampleTestQuestionListItem({ q, onEdit, onDelete }) {
  const loai = q.loaiCauHoi || "mcq";
  const stem = q.noiDung || "";
  const lc = [0, 1, 2, 3].map((i) => (Array.isArray(q.luaChon) ? String(q.luaChon[i] ?? "") : ""));
  const multiIndices = Array.isArray(q.dapAnDungIndices) ? q.dapAnDungIndices.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 3) : [];

  const fileRows = (Array.isArray(q.files) ? q.files : [])
    .map((f) => {
      if (!f) return null;
      if (typeof f === "object" && f !== null)
        return { _id: f._id, url: f.url, originalName: f.originalName || f.filename || String(f._id || "") };
      return { _id: f, url: null, originalName: String(f) };
    })
    .filter(Boolean);

  const renderHtmlOrText = (s) => {
    const t = String(s ?? "");
    if (!t.trim()) return <span className="text-gray-400 italic">(trống)</span>;
    if (looksLikeHtml(t)) {
      return (
        <div
          className={`${HTML_IMG_COMPACT} [&_a]:text-blue-600 dark:[&_a]:text-blue-400 break-words`}
          dangerouslySetInnerHTML={{ __html: t }}
        />
      );
    }
    return <div className="whitespace-pre-wrap break-words">{t}</div>;
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900/30 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 shrink-0">{loai}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">Câu {q.thuTu}</span>
          <span className="text-xs text-green-700 dark:text-green-400 font-medium">{questionAnswerSummaryFromDoc(q)}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-2 rounded-md text-sm font-semibold bg-yellow-400/90 hover:bg-yellow-400 text-white"
          >
            Sửa
          </button>
          <button type="button" onClick={onDelete} className="px-3 py-2 rounded-md text-sm font-semibold bg-red-500 hover:bg-red-600 text-white">
            Xóa
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nội dung / ảnh</div>
        <div className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-950/40 p-2 max-h-56 overflow-auto text-sm text-gray-900 dark:text-gray-100">
          {renderHtmlOrText(stem)}
        </div>
      </div>

      {loai === "mcq" || loai === "multiSelect" ? (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lựa chọn</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["A", "B", "C", "D"].map((label, idx) => {
              const correctMcq = loai === "mcq" && Number(q.dapAnDungIndex) === idx;
              const correctMulti = loai === "multiSelect" && multiIndices.includes(idx);
              const mark = correctMcq || correctMulti;
              return (
                <div
                  key={label}
                  className={`rounded-md border p-2 text-xs max-h-44 overflow-auto ${
                    mark
                      ? "border-green-500 ring-1 ring-green-500/40 bg-green-50/70 dark:bg-green-950/30"
                      : "border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-900/45"
                  }`}
                >
                  <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {label}
                    {mark ? <span className="ml-1 text-green-700 dark:text-green-400 font-normal">(đúng)</span> : null}
                  </div>
                  {renderHtmlOrText(lc[idx])}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {loai === "shortAnswer" && String(q.dapAnDungText || "").trim() ? (
        <div className="text-sm rounded-md border border-gray-200 dark:border-gray-600 p-2 bg-white/70 dark:bg-gray-900/45">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Đáp án mẫu (đầy đủ)</div>
          {renderHtmlOrText(q.dapAnDungText)}
        </div>
      ) : null}

      {String(q.giaiThich || "").trim() ? (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Giải thích</div>
          <div className="rounded-md border border-gray-200 dark:border-gray-600 p-2 max-h-36 overflow-auto text-xs">
            {renderHtmlOrText(q.giaiThich)}
          </div>
        </div>
      ) : null}

      {fileRows.length ? (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">File đính kèm</div>
          <ul className="text-xs space-y-1">
            {fileRows.map((f) => (
              <li key={String(f._id)}>
                {f.url ? (
                  <a
                    href={`${API_BASE}${f.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {f.originalName || f.url}
                  </a>
                ) : (
                  <span className="text-gray-600 dark:text-gray-300 break-all">{f.originalName || String(f._id)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function stringifyCapDo(capDo) {
  const v = String(capDo || "").trim();
  if (!v) return "easy";
  return v;
}

function stripTagsPreview(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== "string") return "";
  if (!/<[a-z][\s\S]*>/i.test(htmlOrText)) return htmlOrText.replace(/\s+/g, " ").trim();
  try {
    const d = new DOMParser().parseFromString(`<div>${htmlOrText}</div>`, "text/html");
    return (d.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return htmlOrText.replace(/\s+/g, " ").trim();
  }
}

function stripTypePrefixFromHtml(html) {
  return String(html || "").replace(/\[\s*(MCQ|MULTI|TF|SA)\s*\]\s*/gi, "");
}

function stripMarkersFromHtml(html) {
  return String(html || "").replace(/\*\*([\s\S]*?)\*\*/g, "$1");
}

/** Đáp án đúng: ** ở đầu (sau khi bỏ tag / trim) hoặc cặp **...** */
function hasAnswerStarMarker(html) {
  const plain = stripTagsPreview(html).trim();
  if (/^\*\*/.test(plain)) return true;
  return /\*\*[\s\S]*?\*\*/.test(String(html || ""));
}

function stripAnswerStarMarker(html) {
  let s = String(html || "").trim();
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  s = s.replace(/^(<p\b[^>]*>)(\s|&nbsp;)*\*\*(\s|&nbsp;)*/i, "$1");
  s = s.replace(/^\s*\*\*\s*/, "");
  return s.trim();
}

function isEssentiallyBoldParagraph(p) {
  if (!p || !p.textContent) return false;
  const clone = p.cloneNode(true);
  clone.querySelectorAll("img").forEach((n) => n.remove());
  const t = (clone.textContent || "").trim();
  if (!t) return false;
  let strongAccum = "";
  clone.querySelectorAll("strong, b").forEach((el) => {
    strongAccum += (el.textContent || "").trim();
  });
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  return norm(strongAccum) === norm(t);
}

function inferPrefixType(text) {
  const m = String(text || "")
    .trim()
    .match(/^\[(MCQ|MULTI|TF|SA)\]\s*/i);
  if (!m) return { type: "mcq", rest: String(text || "").trim(), explicit: false };
  const map = { MCQ: "mcq", MULTI: "multiSelect", TF: "trueFalse", SA: "shortAnswer" };
  const key = m[1].toUpperCase();
  return {
    type: map[key] || "mcq",
    rest: String(text || "")
      .trim()
      .replace(/^\[(MCQ|MULTI|TF|SA)\]\s*/i, "")
      .trim(),
    explicit: true,
  };
}

/**
 * Đúng/Sai implicit: quét [đúng]/[Đ]/[đ]/[d] / [sai]/[S]/[s] trong stem+đáp (không cần [TF]).
 * Nhiều tag: tag xuất hiện sau cùng quyết định.
 */
function parseTrueFalseAnswerFromBracketTags(joinedPlain) {
  const t = String(joinedPlain || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  const re = /\[\s*(đúng|sai|đ|d|s)\s*\]/giu;
  let lastBool = null;
  let m;
  while ((m = re.exec(t)) !== null) {
    const x = m[1].toLowerCase();
    if (x === "sai" || x === "s") lastBool = false;
    else if (x === "đúng" || x === "đ" || x === "d") lastBool = true;
  }
  return lastBool === null ? null : { dapAnDungBoolean: lastBool };
}

/** Bỏ tag TF/bracket đúng-sai khỏi HTML (dùng sau khi nhận diện implicit TF) */
function stripImplicitTrueFalseBracketTagsFromHtml(html) {
  return String(html || "")
    .replace(/\[\s*TF\s*\]/gi, "")
    .replace(/\[\s*(đúng|sai|đ|d|s)\s*\]/giu, "")
    .replace(/\[\s*(ĐÚNG|SAI|Đ|D|S)\s*\]/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

/** [TF] chỉ một dòng: [TF][Đ]/[S]/[Đúng]/[Sai] ngay sau [TF], hoặc cùng tag ở cuối câu */
function parseTrueFalseAnswerFromStemPlain(stemPlainJoined) {
  const t = String(stemPlainJoined || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^\[TF\]/i.test(t)) return null;
  const head = t.match(/^\[TF\]\s*\[\s*(ĐÚNG|Đ|D|SAI|S)\s*\]/iu);
  if (head) {
    const x = head[1].toUpperCase();
    const isFalse = x === "SAI" || x === "S";
    return { dapAnDungBoolean: !isFalse };
  }
  const tail = t.match(/\[\s*(ĐÚNG|Đ|D|SAI|S)\s*\]\s*$/iu);
  if (tail) {
    const x = tail[1].toUpperCase();
    const isFalse = x === "SAI" || x === "S";
    return { dapAnDungBoolean: !isFalse };
  }
  return null;
}

function stripTfAnswerBracketTagsFromHtml(html) {
  return String(html || "")
    .replace(/\[\s*TF\s*\]/gi, "")
    .replace(/\[\s*(ĐÚNG|SAI|Đ|S|D)\s*\]/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function parseQuestionsFromDocxHtml(html) {
  const questions = [];
  const errors = [];
  if (!html || typeof html !== "string") return { questions, errors: ["HTML rỗng."] };

  const root = new DOMParser().parseFromString(`<div id="docx-root">${html}</div>`, "text/html").getElementById("docx-root");
  if (!root) return { questions, errors: ["Không parse được HTML."] };

  const paragraphs = Array.from(root.querySelectorAll("p"));
  let current = null;
  let collectingStem = false;
  /** Tên nhóm từ dòng //tên — áp dụng cho các câu sau cho đến dòng // khác */
  let currentGroupName = null;

  const flush = () => {
    if (!current || !current.stemParts.length) {
      current = null;
      return;
    }
    const { stemParts, optParts, importGroupName } = current;
    const firstPlain = stripTagsPreview(stemParts[0]);
    const { type: loai, explicit } = inferPrefixType(firstPlain);
    const stemHtml = [stripTypePrefixFromHtml(stemParts[0]), ...stemParts.slice(1)].join("").trim();
    const optStrippedMarkers = optParts.map((h) => stripAnswerStarMarker(String(h || "").trim()));
    const marks = optParts.map((h) => hasAnswerStarMarker(h));
    const stemPlainJoined = stemParts.map((s) => stripTagsPreview(s)).join(" ").replace(/\s+/g, " ").trim();
    const optsPlainJoined = optParts.map((h) => stripTagsPreview(h)).join(" ").replace(/\s+/g, " ").trim();
    const joinedPlainForTf = `${stemPlainJoined} ${optsPlainJoined}`.trim();

    if (explicit && loai === "shortAnswer") {
      if (optParts.length < 1) errors.push("Một câu [SA] thiếu dòng đáp án.");
      else if (!marks[0]) errors.push("Câu shortAnswer: đáp án cần có ** ở đầu hoặc bọc **...**.");
      else {
        questions.push({
          loaiCauHoi: "shortAnswer",
          noiDung: stemHtml,
          luaChon: [],
          dapAnDungText: stripTagsPreview(stripAnswerStarMarker(optParts[0])).trim(),
          importGroupName: importGroupName || null,
        });
      }
      current = null;
      return;
    }

    if (explicit && loai === "trueFalse") {
      const fromStemOnly = parseTrueFalseAnswerFromStemPlain(stemPlainJoined);

      if (optParts.length >= 2) {
        const mk = marks.filter(Boolean).length;
        if (mk !== 1) errors.push("trueFalse (2 dòng): cần đúng một dòng Đúng/Sai có ** đáp án đúng.");
        else {
          const idx = marks.indexOf(true);
          const label = stripTagsPreview(optStrippedMarkers[idx]).toLowerCase();
          const isTrue = /^(đúng|true)\b/i.test(label);
          const isFalse = /^(sai|false)\b/i.test(label);
          if (!isTrue && !isFalse) errors.push(`trueFalse: không nhận dạng nhãn: "${label}"`);
          else {
            questions.push({
              loaiCauHoi: "trueFalse",
              noiDung: stemHtml,
              luaChon: [],
              dapAnDungBoolean: isFalse && !isTrue ? false : true,
              importGroupName: importGroupName || null,
            });
          }
        }
      } else if (fromStemOnly) {
        const cleanedHtml = stripTfAnswerBracketTagsFromHtml(stemHtml).trim();
        const noiDungClean = cleanedHtml || stripTagsPreview(stemHtml).trim();
        questions.push({
          loaiCauHoi: "trueFalse",
          noiDung: noiDungClean,
          luaChon: [],
          dapAnDungBoolean: fromStemOnly.dapAnDungBoolean,
          importGroupName: importGroupName || null,
        });
      } else {
        errors.push(
          "Câu [TF] một dòng: thêm [Đ] hoặc [S] (hoặc [Đúng]/[Sai]) ngay sau [TF], hoặc cùng tag đó ở cuối câu. Hoặc dùng 2 dòng Đúng/Sai với **."
        );
      }
      current = null;
      return;
    }

    if (explicit && loai === "multiSelect") {
      if (optParts.length !== 4) errors.push("Một câu [MULTI] cần đúng 4 lựa chọn.");
      const cnt = marks.filter(Boolean).length;
      if (cnt < 2) errors.push("multiSelect: cần ít nhất 2 lựa chọn có **.");
      if (optParts.length === 4 && cnt >= 2) {
        questions.push({
          loaiCauHoi: "multiSelect",
          noiDung: stemHtml,
          luaChon: optStrippedMarkers,
          dapAnDungIndices: marks.map((m, i) => (m ? i : null)).filter((x) => x !== null),
          importGroupName: importGroupName || null,
        });
      }
      current = null;
      return;
    }

    if (explicit && loai === "mcq") {
      if (optParts.length !== 4) errors.push("Một câu [MCQ] cần đúng 4 lựa chọn sau stem.");
      const mcqMarks = marks.filter(Boolean).length;
      if (optParts.length === 4 && mcqMarks !== 1) errors.push("MCQ: cần đúng một lựa chọn có **đáp án đúng**.");
      if (optParts.length === 4 && mcqMarks === 1) {
        questions.push({
          loaiCauHoi: "mcq",
          noiDung: stemHtml,
          luaChon: optStrippedMarkers,
          dapAnDungIndex: marks.indexOf(true),
          importGroupName: importGroupName || null,
        });
      }
      current = null;
      return;
    }

    /* --- Không có tiền tố [MCQ]/…: suy luận implicit --- */
    const fromBrackets = parseTrueFalseAnswerFromBracketTags(joinedPlainForTf);
    if (fromBrackets) {
      const stemClean = [stripTypePrefixFromHtml(stemParts[0]), ...stemParts.slice(1)]
        .map((s) => stripImplicitTrueFalseBracketTagsFromHtml(String(s || "").trim()))
        .join("")
        .trim();
      const optsClean = optParts.map((h) => stripImplicitTrueFalseBracketTagsFromHtml(String(h || "").trim())).join(" ").trim();
      const noiDungTf = (stemClean + (optsClean ? ` ${optsClean}` : "")).trim() || stripTagsPreview(stemHtml).trim();
      questions.push({
        loaiCauHoi: "trueFalse",
        noiDung: noiDungTf,
        luaChon: [],
        dapAnDungBoolean: fromBrackets.dapAnDungBoolean,
        importGroupName: importGroupName || null,
      });
      current = null;
      return;
    }

    if (optParts.length >= 2) {
      const mk = marks.filter(Boolean).length;
      if (mk === 1) {
        const idx = marks.indexOf(true);
        const label = stripTagsPreview(optStrippedMarkers[idx]).toLowerCase();
        const isTrue = /^(đúng|true)\b/i.test(label);
        const isFalse = /^(sai|false)\b/i.test(label);
        if (isTrue || isFalse) {
          questions.push({
            loaiCauHoi: "trueFalse",
            noiDung: stemHtml,
            luaChon: [],
            dapAnDungBoolean: isFalse && !isTrue ? false : true,
            importGroupName: importGroupName || null,
          });
          current = null;
          return;
        }
      }
    }

    if (optParts.length === 1 && !marks[0]) {
      questions.push({
        loaiCauHoi: "shortAnswer",
        noiDung: stemHtml,
        luaChon: [],
        dapAnDungText: stripTagsPreview(String(optParts[0] || "")).trim(),
        importGroupName: importGroupName || null,
      });
      current = null;
      return;
    }

    const starCnt = marks.filter(Boolean).length;
    if (optParts.length === 4 && starCnt >= 2) {
      questions.push({
        loaiCauHoi: "multiSelect",
        noiDung: stemHtml,
        luaChon: optStrippedMarkers,
        dapAnDungIndices: marks.map((m, i) => (m ? i : null)).filter((x) => x !== null),
        importGroupName: importGroupName || null,
      });
      current = null;
      return;
    }

    if (optParts.length === 4 && starCnt === 1) {
      questions.push({
        loaiCauHoi: "mcq",
        noiDung: stemHtml,
        luaChon: optStrippedMarkers,
        dapAnDungIndex: marks.indexOf(true),
        importGroupName: importGroupName || null,
      });
      current = null;
      return;
    }

    if (optParts.length === 0) errors.push("Câu thiếu dòng đáp án / lựa chọn sau stem.");
    else if (optParts.length === 4) errors.push("Không khớp quy tắc: MCQ cần đúng 1 **; multi cần ≥2 **; hoặc thêm [Đ]/[S]… cho đúng sai.");
    else if (optParts.length !== 1) errors.push(`Câu implicit: cần đúng 4 lựa chọn (MCQ/multi) hoặc 1 dòng đáp ngắn (không **). Hiện có ${optParts.length} dòng sau stem.`);
    else errors.push("Câu implicit: 1 dòng đáp nhưng có ** — bỏ ** hoặc dùng 4 lựa chọn.");

    current = null;
  };

  for (const p of paragraphs) {
    const plainOneLine = (p.textContent || "").replace(/\s+/g, " ").trim();
    const groupLine = plainOneLine.match(/^\/\/\s*(.+)$/);
    if (groupLine) {
      const gName = String(groupLine[1] || "").trim();
      if (gName) currentGroupName = gName;
      continue;
    }
    if (isEssentiallyBoldParagraph(p)) {
      flush();
      current = { stemParts: [p.innerHTML], optParts: [], importGroupName: currentGroupName };
      collectingStem = true;
      continue;
    }
    if (!current) continue;
    const inner = p.innerHTML;
    const hasImg = !!p.querySelector("img");
    if (collectingStem) {
      if (hasImg || !hasAnswerStarMarker(String(inner))) {
        current.stemParts.push(inner);
        continue;
      }
      collectingStem = false;
    }
    current.optParts.push(inner);
  }
  flush();

  return { questions, errors };
}

function dataUriToBlob(dataUri) {
  const m = /^data:([^;,]+);base64,(.+)$/i.exec(dataUri);
  if (!m) return null;
  try {
    const binary = atob(m[2]);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  } catch {
    return null;
  }
}

async function replaceDataUriImagesInHtml(htmlString, fileUploadUrl, token) {
  if (!htmlString || typeof htmlString !== "string" || !htmlString.includes("data:")) {
    return { html: htmlString || "", fileIds: [] };
  }
  const doc = new DOMParser().parseFromString(`<div id="wrap">${htmlString}</div>`, "text/html");
  const w = doc.getElementById("wrap");
  if (!w) return { html: htmlString, fileIds: [] };
  const imgs = Array.from(w.querySelectorAll('img[src^="data:"]'));
  const fileIds = [];
  let idx = 0;
  for (const img of imgs) {
    const src = img.getAttribute("src");
    const blob = dataUriToBlob(src);
    if (!blob) continue;
    const ext = blob.type.includes("png") ? "png" : blob.type.includes("jpeg") || blob.type.includes("jpg") ? "jpg" : "png";
    const fd = new FormData();
    fd.append("files", blob, `docx-embed-${Date.now()}-${idx}.${ext}`);
    idx += 1;
    try {
      const res = await fetch(fileUploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.[0]?.url) continue;
      const f = json.data[0];
      fileIds.push(f._id);
      img.setAttribute("src", `${API_BASE}${f.url}`);
    } catch {
      /* bỏ qua ảnh lỗi */
    }
  }
  return { html: w.innerHTML, fileIds };
}

async function hydrateQuestionHtmlAndFiles(q, fileUploadUrl, token) {
  const r1 = await replaceDataUriImagesInHtml(q.noiDung, fileUploadUrl, token);
  let noiDung = r1.html;
  const allIds = [...r1.fileIds];
  let luaChon = q.luaChon;
  if (Array.isArray(q.luaChon) && q.luaChon.length) {
    const next = [];
    for (const c of q.luaChon) {
      const r = await replaceDataUriImagesInHtml(String(c || ""), fileUploadUrl, token);
      next.push(r.html);
      allIds.push(...r.fileIds);
    }
    luaChon = next;
  }
  return { ...q, noiDung, luaChon, filesFromHtml: allIds };
}

function SampleTestEditor({
  token,
  notify,
  mode,
  activeTestId,
  activeTest,
  courses,
  courseTypes,
  API_SAMPLE_TESTS,
  FILE_UPLOAD_API_URL,
  FILE_EXTRACT_DOCX_HTML_URL,
  onBack,
}) {
  const [testId, setTestId] = useState(mode === "edit" ? activeTestId : null);
  const [localTest, setLocalTest] = useState(activeTest);
  const [expandedPartId, setExpandedPartId] = useState(activeTest?.parts?.[0]?._id || null);
  /** Mở/đóng danh sách câu trong từng nhóm / "Không nhóm" (key: `${partId}::${groupId}|__ungrouped__`, mặc định mở) */
  const [questionListExpanded, setQuestionListExpanded] = useState({});

  const [partModalOpen, setPartModalOpen] = useState(false);
  const [partEditing, setPartEditing] = useState(null);
  const [partForm, setPartForm] = useState({ tenPhan: "", thuTu: 1 });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionEditing, setQuestionEditing] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    thuTu: 1,
    loaiCauHoi: "mcq",
    noiDung: "",
    luaChon: ["", "", "", ""],
    dapAnDungIndex: 0,
    multiCorrect: [false, false, false, false],
    dapAnDungBoolean: true,
    dapAnDungText: "",
    giaiThich: "",
    deThiMauPhanNhomID: "",
  });
  const [questionFiles, setQuestionFiles] = useState([]); // File records from /api/admin/files/upload

  const [importDocxOpen, setImportDocxOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importCommitting, setImportCommitting] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importTarget, setImportTarget] = useState({ partId: null, groupId: "" });

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupEditing, setGroupEditing] = useState(null);
  const [groupForm, setGroupForm] = useState({ tenNhom: "", thuTu: 1 });
  const [groupFiles, setGroupFiles] = useState([]); // File records
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const [confirmDeleteGroupOpen, setConfirmDeleteGroupOpen] = useState(false);

  const [confirmDeletePartOpen, setConfirmDeletePartOpen] = useState(false);
  const [deletePartId, setDeletePartId] = useState(null);
  const [confirmDeleteQuestionOpen, setConfirmDeleteQuestionOpen] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);

  const questionListSectionKey = (partId, sectionId) => `${String(partId)}::${String(sectionId)}`;
  const isQuestionListOpen = (partId, sectionId) => questionListExpanded[questionListSectionKey(partId, sectionId)] !== false;
  const toggleQuestionListSection = (partId, sectionId) => {
    const k = questionListSectionKey(partId, sectionId);
    setQuestionListExpanded((prev) => ({ ...prev, [k]: !(prev[k] !== false) }));
  };
  const UNGROUPED_QUESTION_SECTION = "__ungrouped__";

  useEffect(() => {
    setLocalTest(activeTest);
    setExpandedPartId(activeTest?.parts?.[0]?._id || null);
    if (mode === "edit") setTestId(activeTestId);
  }, [activeTest, activeTestId, mode]);

  const isCreate = mode === "create";

  const getCourseOptionsByChungChi = (cc) => {
    const mapCourseTypeIdToChungChi = new Map(
      (courseTypes || []).map((ct) => [String(ct._id), String(ct.ChungChi || "").toUpperCase()])
    );
    return (courses || [])
      .filter((c) => {
        const ctId = c.LoaiKhoaHocID?._id || c.LoaiKhoaHocID;
        const ctChungChi = mapCourseTypeIdToChungChi.get(String(ctId || ""));
        if (!ctChungChi) return false;
        return cc === "all" ? true : ctChungChi === cc;
      })
      .map((c) => ({
        value: String(c._id),
        label: `${c.tenkhoahoc || "Khóa học"}${c.LoaiKhoaHocID?.Tenloai ? ` - ${c.LoaiKhoaHocID.Tenloai}` : ""}`,
      }));
  };

  const courseOptions = useMemo(
    () => getCourseOptionsByChungChi(String(localTest?.chungChi || "TOEIC").toUpperCase()),
    [localTest?.chungChi, courses, courseTypes]
  );

  const courseOptionsWithAll = useMemo(
    () => [{ value: "", label: "Tất cả khóa học (chung)" }, ...courseOptions],
    [courseOptions]
  );

  const khoaHocSelectValue = useMemo(() => {
    const k = localTest?.khoaHocID;
    if (k == null || k === "") return "";
    if (typeof k === "object" && k !== null && k._id != null) return String(k._id);
    return String(k);
  }, [localTest?.khoaHocID]);

  const refreshTest = async (id) => {
    try {
      const res = await fetch(`${API_SAMPLE_TESTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết đề.");
      setLocalTest(json.data);
      setExpandedPartId(json.data.parts?.[0]?._id || null);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải lại.");
    }
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(FILE_UPLOAD_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload thất bại.");
      return Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi upload file.");
      return [];
    }
  };

  const saveTestMeta = async () => {
    try {
      const payload = {
        khoaHocID: (() => {
          const k = localTest.khoaHocID;
          if (k == null || k === "") return null;
          if (typeof k === "object" && k !== null && k._id != null) return String(k._id);
          const s = String(k).trim();
          return s || null;
        })(),
        tenDe: localTest.tenDe,
        chungChi: String(localTest.chungChi || "").toUpperCase(),
        capDo: stringifyCapDo(localTest.capDo),
        thoiGianLamBai: Number(localTest.thoiGianLamBai),
        moTa: localTest.moTa,
      };

      // Khóa học có thể bỏ trống (đề dùng chung cho tất cả khóa)
      if (!payload.tenDe?.trim()) return notify.warning("Nhập tên đề.");

      if (isCreate && !testId) {
        const res = await fetch(`${API_SAMPLE_TESTS}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo đề.");
        const createdId = json.data?._id;
        if (!createdId) throw new Error("Không nhận được id sau khi tạo đề.");
        setTestId(createdId);
        notify.success("Tạo đề thành công.");
        await refreshTest(createdId);
      } else {
        const idToUpdate = testId;
        if (!idToUpdate) return notify.warning("Chưa có id đề.");
        const res = await fetch(`${API_SAMPLE_TESTS}/${idToUpdate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật đề.");
        notify.success("Cập nhật metadata thành công.");
        await refreshTest(idToUpdate);
      }
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu đề.");
    }
  };

  const openCreatePart = () => {
    const nextThuTu = (localTest.parts || []).reduce((m, p) => Math.max(m, Number(p.thuTu || 0)), 0) + 1;
    setPartEditing(null);
    setPartForm({ tenPhan: "", thuTu: nextThuTu });
    setPartModalOpen(true);
  };

  const openEditPart = (part) => {
    setPartEditing(part);
    setPartForm({ tenPhan: part.tenPhan || "", thuTu: Number(part.thuTu || 1) });
    setPartModalOpen(true);
  };

  const submitPart = async () => {
    try {
      if (!testId) return notify.warning("Hãy lưu metadata trước để tạo được part.");
      const tenPhan = String(partForm.tenPhan || "").trim();
      const thuTu = Number(partForm.thuTu);
      if (!tenPhan) return notify.warning("Nhập tên phần.");
      if (!Number.isFinite(thuTu) || thuTu < 1) return notify.warning("ThuTu không hợp lệ.");

      if (!partEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenPhan, thuTu }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo phần.");
        notify.success("Tạo phần thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenPhan, thuTu }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật phần.");
        notify.success("Cập nhật phần thành công.");
      }

      setPartModalOpen(false);
      setPartEditing(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu phần.");
    }
  };

  const confirmDeletePart = (partId) => {
    setDeletePartId(partId);
    setConfirmDeletePartOpen(true);
  };

  const deletePart = async () => {
    try {
      if (!testId || !deletePartId) return;
      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${deletePartId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa phần.");
      notify.success("Đã xóa phần.");
      setConfirmDeletePartOpen(false);
      setDeletePartId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa phần.");
    }
  };

  // ===== Groups (nhóm nhỏ trong part) =====
  const openCreateGroup = (part) => {
    const groups = part.groups || [];
    const nextThuTu = groups.reduce((m, g) => Math.max(m, Number(g.thuTu || 0)), 0) + 1;
    setGroupEditing(null);
    setGroupForm({ tenNhom: "", thuTu: nextThuTu });
    setGroupFiles([]);
    setDeleteGroupId(null);
    setGroupModalOpen(true);
  };

  const openEditGroup = (group) => {
    setGroupEditing(group);
    setGroupForm({
      tenNhom: group.tenNhom || "",
      thuTu: Number(group.thuTu || 1),
    });
    const normalizedFiles = (Array.isArray(group.files) ? group.files : []).map((f) => {
      if (!f) return null;
      if (typeof f === "string") return { _id: f, originalName: f };
      return f;
    }).filter(Boolean);
    setGroupFiles(normalizedFiles);
    setDeleteGroupId(null);
    setGroupModalOpen(true);
  };

  const submitGroup = async () => {
    try {
      if (!testId) return notify.warning("Chưa có id đề.");
      const partId = expandedPartId;
      if (!partId) return notify.warning("Chọn part hợp lệ.");

      const tenNhom = String(groupForm.tenNhom || "").trim();
      const thuTu = Number(groupForm.thuTu);
      if (!tenNhom) return notify.warning("Nhập tên nhóm.");
      if (!Number.isFinite(thuTu) || thuTu < 1) return notify.warning("thuTu không hợp lệ.");

      const payload = {
        tenNhom,
        thuTu,
        files: (groupFiles || []).map((f) => f?._id).filter(Boolean),
      };

      if (!groupEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo nhóm.");
        notify.success("Tạo nhóm thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups/${groupEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật nhóm.");
        notify.success("Cập nhật nhóm thành công.");
      }

      setGroupModalOpen(false);
      setGroupEditing(null);
      setGroupFiles([]);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu nhóm.");
    }
  };

  const confirmDeleteGroup = (groupId) => {
    setDeleteGroupId(groupId);
    setConfirmDeleteGroupOpen(true);
  };

  const deleteGroup = async () => {
    try {
      if (!testId || !deleteGroupId) return;
      const partId = expandedPartId;
      if (!partId) return;

      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups/${deleteGroupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa nhóm.");
      notify.success("Đã xóa nhóm.");
      setConfirmDeleteGroupOpen(false);
      setDeleteGroupId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa nhóm.");
    }
  };

  const openCreateQuestion = (part, groupId = "") => {
    const questions = part.questions || [];
    const nextThuTu = questions.reduce((m, q) => Math.max(m, Number(q.thuTu || 0)), 0) + 1;
    setQuestionEditing(null);
    setQuestionForm({
      thuTu: nextThuTu,
      loaiCauHoi: "mcq",
      noiDung: "",
      luaChon: ["", "", "", ""],
      dapAnDungIndex: 0,
      multiCorrect: [false, false, false, false],
      dapAnDungBoolean: true,
      dapAnDungText: "",
      giaiThich: "",
      deThiMauPhanNhomID: groupId || "",
    });
    setQuestionFiles([]);
    setExpandedPartId(part._id);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (question) => {
    setQuestionEditing(question);
    const loai = question.loaiCauHoi || "mcq";
    const indices = Array.isArray(question.dapAnDungIndices) ? question.dapAnDungIndices.map(Number) : [];
    const multiCorrect = [0, 1, 2, 3].map((i) => indices.includes(i));
    const lcFromDb = Array.isArray(question.luaChon) ? question.luaChon.map((x) => String(x ?? "")) : [];
    const luaChonFour = [0, 1, 2, 3].map((i) => lcFromDb[i] ?? "");
    const di = Number(question.dapAnDungIndex ?? 0);
    setQuestionForm({
      thuTu: Number(question.thuTu || 1),
      loaiCauHoi: loai,
      noiDung: question.noiDung || "",
      luaChon: luaChonFour,
      dapAnDungIndex: Number.isFinite(di) && Number.isInteger(di) && di >= 0 && di <= 3 ? di : 0,
      multiCorrect,
      dapAnDungBoolean: loai === "trueFalse" ? question.dapAnDungBoolean === true : true,
      dapAnDungText: question.dapAnDungText || "",
      giaiThich: question.giaiThich || "",
      deThiMauPhanNhomID: question.deThiMauPhanNhomID ? String(question.deThiMauPhanNhomID) : "",
    });
    const normalizedFiles = (Array.isArray(question.files) ? question.files : []).map((f) => {
      if (!f) return null;
      if (typeof f === "string") return { _id: f, originalName: f };
      return f;
    }).filter(Boolean);
    setQuestionFiles(normalizedFiles);
    setQuestionModalOpen(true);
  };

  const submitQuestion = async () => {
    try {
      if (!testId) return notify.warning("Chưa có id đề.");
      const part = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
      if (!part) return notify.warning("Chọn part hợp lệ.");

      const loai = String(questionForm.loaiCauHoi || "mcq").trim();
      const thuTu = Number(questionForm.thuTu);
      const noiDung = String(questionForm.noiDung || "").trim();
      const giaiThich = String(questionForm.giaiThich || "").trim();
      const luaChonTrim = (questionForm.luaChon || []).map((x) => String(x || "").trim());

      const payload = {
        thuTu,
        noiDung,
        giaiThich,
        loaiCauHoi: loai,
        deThiMauPhanNhomID: questionForm.deThiMauPhanNhomID || null,
        files: (questionFiles || []).map((f) => f?._id).filter(Boolean),
      };

      if (!noiDung) return notify.warning("Nhập nội dung câu hỏi.");

      if (loai === "mcq") {
        if (luaChonTrim.length !== 4 || luaChonTrim.some((s) => !s)) return notify.warning("MCQ cần đúng 4 lựa chọn (không rỗng).");
        const di = Number(questionForm.dapAnDungIndex);
        if (!Number.isInteger(di) || di < 0 || di > 3) return notify.warning("Chọn một đáp án đúng (A–D).");
        payload.luaChon = luaChonTrim;
        payload.dapAnDungIndex = di;
      } else if (loai === "multiSelect") {
        if (luaChonTrim.length !== 4 || luaChonTrim.some((s) => !s)) return notify.warning("Chọn nhiều: cần đúng 4 lựa chọn.");
        const idxs = [0, 1, 2, 3].filter((i) => questionForm.multiCorrect?.[i]);
        if (idxs.length === 0) return notify.warning("Chọn ít nhất một đáp án đúng.");
        payload.luaChon = luaChonTrim;
        payload.dapAnDungIndices = idxs;
      } else if (loai === "trueFalse") {
        payload.dapAnDungBoolean = Boolean(questionForm.dapAnDungBoolean);
        payload.luaChon = [];
      } else if (loai === "shortAnswer") {
        const t = String(questionForm.dapAnDungText || "").trim();
        if (!t) return notify.warning("Nhập đáp án mẫu (short answer).");
        payload.dapAnDungText = t;
        payload.luaChon = [];
      } else {
        return notify.warning("Loại câu hỏi không hợp lệ.");
      }

      if (!questionEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo câu hỏi.");
        notify.success("Tạo câu hỏi thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions/${questionEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật câu hỏi.");
        notify.success("Cập nhật câu hỏi thành công.");
      }

      setQuestionModalOpen(false);
      setQuestionEditing(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu câu hỏi.");
    }
  };

  const confirmDeleteQuestion = (questionId) => {
    setDeleteQuestionId(questionId);
    setConfirmDeleteQuestionOpen(true);
  };

  const deleteQuestion = async () => {
    try {
      if (!testId || !deleteQuestionId) return;
      const part = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
      if (!part) return notify.warning("Không xác định part để xóa câu.");
      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions/${deleteQuestionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa câu hỏi.");
      notify.success("Đã xóa câu hỏi.");
      setConfirmDeleteQuestionOpen(false);
      setDeleteQuestionId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa câu hỏi.");
    }
  };

  const openImportDocx = (part, groupId = "") => {
    if (!testId) return notify.warning("Chưa có id đề.");
    setExpandedPartId(part._id);
    setImportTarget({ partId: part._id, groupId: groupId || "" });
    setImportRows([]);
    setImportErrors([]);
    setImportDocxOpen(true);
  };

  const runImportDocxFile = async (file) => {
    if (!file?.name?.toLowerCase().endsWith(".docx")) {
      notify.warning("Chỉ hỗ trợ file .docx.");
      return;
    }
    setImportLoading(true);
    setImportRows([]);
    setImportErrors([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(FILE_EXTRACT_DOCX_HTML_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không trích được HTML từ docx.");
      const { questions, errors } = parseQuestionsFromDocxHtml(json.html || "");
      setImportRows(questions);
      setImportErrors(errors);
      if (!questions.length) {
        notify.warning(errors.length ? errors.join(" ") : "Không parse được câu hỏi nào — kiểm tra định dạng Word.");
      } else {
        notify.success(`Đã phân tích ${questions.length} câu.`);
      }
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi import Word.");
    } finally {
      setImportLoading(false);
    }
  };

  const commitImportDocx = async () => {
    if (!testId || !importTarget.partId || !importRows.length) return;
    const part = (localTest.parts || []).find((p) => String(p._id) === String(importTarget.partId));
    if (!part) return notify.warning("Không tìm thấy part.");
    setImportCommitting(true);
    try {
      let thuTuNext = (part.questions || []).reduce((m, q) => Math.max(m, Number(q.thuTu || 0)), 0);
      const groupCache = new Map();
      (part.groups || []).forEach((g) => {
        if (g?.tenNhom) groupCache.set(String(g.tenNhom).trim(), String(g._id));
      });
      let nextGroupThuTu = (part.groups || []).reduce((m, g) => Math.max(m, Number(g.thuTu || 0)), 0) + 1;

      const ensureImportGroup = async (name) => {
        const raw = String(name || "").trim();
        if (!raw) return importTarget.groupId ? importTarget.groupId : null;
        if (groupCache.has(raw)) return groupCache.get(raw);
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenNhom: raw, thuTu: nextGroupThuTu }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || `Không tạo được nhóm "${raw}".`);
        nextGroupThuTu += 1;
        const gid = String(json.data?._id || "");
        if (!gid) throw new Error(`Không nhận được id nhóm "${raw}".`);
        groupCache.set(raw, gid);
        return gid;
      };

      for (const row of importRows) {
        const hydrated = await hydrateQuestionHtmlAndFiles(row, FILE_UPLOAD_API_URL, token);
        thuTuNext += 1;
        const nhom =
          hydrated.importGroupName != null && String(hydrated.importGroupName).trim()
            ? await ensureImportGroup(hydrated.importGroupName)
            : importTarget.groupId
              ? importTarget.groupId
              : null;
        const payload = {
          thuTu: thuTuNext,
          noiDung: hydrated.noiDung,
          giaiThich: "",
          loaiCauHoi: hydrated.loaiCauHoi,
          deThiMauPhanNhomID: nhom,
          files: [...(hydrated.filesFromHtml || [])].filter(Boolean),
        };
        if (hydrated.loaiCauHoi === "mcq") {
          payload.luaChon = hydrated.luaChon;
          payload.dapAnDungIndex = hydrated.dapAnDungIndex;
        } else if (hydrated.loaiCauHoi === "multiSelect") {
          payload.luaChon = hydrated.luaChon;
          payload.dapAnDungIndices = hydrated.dapAnDungIndices;
        } else if (hydrated.loaiCauHoi === "trueFalse") {
          payload.dapAnDungBoolean = hydrated.dapAnDungBoolean;
          payload.luaChon = [];
        } else if (hydrated.loaiCauHoi === "shortAnswer") {
          payload.dapAnDungText = hydrated.dapAnDungText;
          payload.luaChon = [];
        }
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo câu hỏi.");
      }
      notify.success(`Đã nhập ${importRows.length} câu.`);
      setImportDocxOpen(false);
      setImportRows([]);
      setImportErrors([]);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi nhập hàng loạt.");
    } finally {
      setImportCommitting(false);
    }
  };

  const activePartForQuestion = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
  const groupSelectOptions = [
    { value: "", label: "Không nhóm" },
    ...((activePartForQuestion?.groups || []).map((g) => ({
      value: String(g._id),
      label: g.tenNhom,
    }))),
  ];

  const capDoOptions = [
    { value: "easy", label: "easy" },
    { value: "medium", label: "medium" },
    { value: "hard", label: "hard" },
    { value: "dễ", label: "dễ" },
    { value: "trung bình", label: "trung bình" },
    { value: "khó", label: "khó" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="admin-card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="admin-page-title">{isCreate ? "Tạo đề thi mẫu" : "Chỉnh sửa đề thi mẫu"}</h1>
            <p className="admin-page-subtitle !mt-1">
              {String(localTest?.chungChi || "").toUpperCase()} — part / MCQ, chọn nhiều, Đúng-Sai, trả lời ngắn, import Word
            </p>
          </div>
          <button type="button" onClick={onBack} className="admin-btn-outline h-fit shrink-0">
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-5">
            <AdminCard className="overflow-hidden p-0">
              <div className="admin-card-head">Thông tin đề</div>
              <form
                className="px-5 py-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveTestMeta();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đề</label>
                  <InputField
                    type="text"
                    name="tenDe"
                    value={localTest.tenDe}
                    onChange={(e) => setLocalTest((p) => ({ ...p, tenDe: e.target.value }))}
                    placeholder="Ví dụ: TOEIC Foundation Test"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chứng chỉ</label>
                  <InputField
                    type="select"
                    name="chungChi"
                    value={localTest.chungChi}
                    onChange={(e) => setLocalTest((p) => ({ ...p, chungChi: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={[
                      { value: "TOEIC", label: "TOEIC" },
                      { value: "IELTS", label: "IELTS" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khóa học</label>
                  <InputField
                    type="select"
                    name="khoaHocID"
                    value={khoaHocSelectValue}
                    onChange={(e) =>
                      setLocalTest((p) => ({
                        ...p,
                        khoaHocID: e.target.value === "" ? null : e.target.value,
                      }))
                    }
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={courseOptionsWithAll}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Chọn &quot;Tất cả khóa học (chung)&quot; để đề không gắn một khóa cụ thể.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp độ</label>
                    <InputField
                      type="select"
                      name="capDo"
                      value={String(localTest.capDo || "")}
                      onChange={(e) => setLocalTest((p) => ({ ...p, capDo: e.target.value }))}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      options={capDoOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (phút)</label>
                    <InputField
                      type="number"
                      name="thoiGianLamBai"
                      value={localTest.thoiGianLamBai}
                      onChange={(e) => setLocalTest((p) => ({ ...p, thoiGianLamBai: e.target.value }))}
                      min={1}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                  <InputField
                    type="textarea"
                    name="moTa"
                    value={localTest.moTa}
                    onChange={(e) => setLocalTest((p) => ({ ...p, moTa: e.target.value }))}
                    rows={4}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="submit" className="admin-btn-accent">
                    {isCreate ? "Lưu & tạo đề" : "Lưu metadata"}
                  </button>
                </div>
              </form>
            </AdminCard>
          </section>

          <section className="space-y-6 lg:col-span-7">
            <AdminCard className="overflow-hidden p-0">
              <div className="admin-card-head flex flex-wrap items-center justify-between gap-4">
                <span>Parts & câu hỏi</span>
                <button
                  type="button"
                  onClick={openCreatePart}
                  disabled={!testId}
                  className={`inline-flex items-center gap-2 rounded-md text-sm font-semibold ${testId ? "admin-btn-accent-sm admin-btn-accent" : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                >
                  <FiPlus className="shrink-0" />
                  Thêm phần
                </button>
              </div>

              <div className="px-5 py-4">
                {(localTest.parts || []).length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có part nào. Thêm part để bắt đầu nhập câu hỏi.</div>
                ) : (
                  <div className="space-y-3">
                    {(localTest.parts || []).map((part) => {
                      const expanded = String(expandedPartId) === String(part._id);
                      const ungroupedQsOpen = isQuestionListOpen(part._id, UNGROUPED_QUESTION_SECTION);
                      return (
                        <div key={part._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {part.thuTu}. {part.tenPhan}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{part.questions?.length ?? 0} câu</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setExpandedPartId(expanded ? null : part._id)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={expanded ? "Thu gọn" : "Mở rộng"}
                              >
                                {expanded ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openImportDocx(part, "")}
                                disabled={!testId}
                                className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-slate-600 text-white hover:bg-slate-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                <FiUpload className="h-4 w-4" />
                                Import Word
                              </button>
                              <button
                                type="button"
                                onClick={() => openCreateQuestion(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Thêm câu
                              </button>
                              <button
                                type="button"
                                onClick={() => openCreateGroup(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Thêm nhóm
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditPart(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-yellow-400/90 text-white hover:bg-yellow-400" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDeletePart(part._id)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="px-4 py-3">
                              {(part.groups || []).length === 0 && (part.ungroupedQuestions || []).length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu hỏi.</div>
                              ) : (
                                <div className="space-y-3">
                                  {(part.groups || []).map((group) => {
                                    const groupQsOpen = isQuestionListOpen(part._id, group._id);
                                    return (
                                      <div key={group._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/10">
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={() => toggleQuestionListSection(part._id, group._id)}
                                              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                                              title={groupQsOpen ? "Thu gọn danh sách câu" : "Mở danh sách câu"}
                                            >
                                              {groupQsOpen ? <FiChevronUp /> : <FiChevronDown />}
                                            </button>
                                            <div className="min-w-0">
                                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                                {group.tenNhom}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                file: {group.files?.length ?? 0} | câu: {group.questions?.length ?? 0}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                            <button
                                              type="button"
                                              onClick={() => openImportDocx(part, group._id)}
                                              disabled={!testId}
                                              className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-slate-600 text-white hover:bg-slate-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                            >
                                              <FiUpload className="h-4 w-4" />
                                              Import Word
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openCreateQuestion(part, group._id)}
                                              disabled={!testId}
                                              className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                            >
                                              Thêm câu
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openEditGroup(group)}
                                              disabled={!testId}
                                              className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-yellow-400/90 hover:bg-yellow-400 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                            >
                                              Sửa nhóm
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => confirmDeleteGroup(group._id)}
                                              disabled={!testId}
                                              className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                            >
                                              Xóa
                                            </button>
                                          </div>
                                        </div>

                                        {groupQsOpen ? (
                                          <div className="px-3 py-2 space-y-2">
                                            {(group.questions || []).length === 0 ? (
                                              <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu trong nhóm.</div>
                                            ) : (
                                              (group.questions || []).map((q) => (
                                                <SampleTestQuestionListItem
                                                  key={q._id}
                                                  q={q}
                                                  onEdit={() => openEditQuestion(q)}
                                                  onDelete={() => confirmDeleteQuestion(q._id)}
                                                />
                                              ))
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}

                                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/10">
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                        <button
                                          type="button"
                                          onClick={() => toggleQuestionListSection(part._id, UNGROUPED_QUESTION_SECTION)}
                                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                                          title={ungroupedQsOpen ? "Thu gọn danh sách câu" : "Mở danh sách câu"}
                                        >
                                          {ungroupedQsOpen ? <FiChevronUp /> : <FiChevronDown />}
                                        </button>
                                        <div className="min-w-0">
                                          <div className="font-semibold text-gray-900 dark:text-white truncate">Không nhóm</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            câu: {(part.ungroupedQuestions || []).length}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                        <button
                                          type="button"
                                          onClick={() => openImportDocx(part, "")}
                                          disabled={!testId}
                                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-slate-600 text-white hover:bg-slate-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                        >
                                          <FiUpload className="h-4 w-4" />
                                          Import Word
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openCreateQuestion(part, "")}
                                          disabled={!testId}
                                          className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                        >
                                          Thêm câu
                                        </button>
                                      </div>
                                    </div>
                                    {ungroupedQsOpen ? (
                                      <div className="px-3 py-2 space-y-2">
                                        {(part.ungroupedQuestions || []).length === 0 ? (
                                          <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu không nhóm.</div>
                                        ) : (
                                          (part.ungroupedQuestions || []).map((q) => (
                                            <SampleTestQuestionListItem
                                              key={q._id}
                                              q={q}
                                              onEdit={() => openEditQuestion(q)}
                                              onDelete={() => confirmDeleteQuestion(q._id)}
                                            />
                                          ))
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AdminCard>

            <details className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 group">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block">▸</span>
                Xem mẫu định dạng Word (giống file .docx)
              </summary>
              <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700">
                <WordImportVisualSample className="mt-3" />
              </div>
            </details>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Word: đoạn <strong>in đậm</strong> = câu hỏi; đoạn thường = lựa chọn; đáp án đúng: <code>**</code> ở <strong>đầu dòng</strong> hoặc bọc <code>**...**</code>.{" "}
              <strong>Không cần tiền tố</strong> nếu: có <code>[Đ]</code>/<code>[đ]</code>/<code>[d]</code>/<code>[Đúng]</code> hoặc <code>[S]</code>/<code>[Sai]</code> trong stem hoặc đáp → đúng/sai; chỉ{" "}
              <strong>một</strong> dòng đáp và <strong>không</strong> có <code>**</code> → trả lời ngắn; <strong>≥2</strong> trong <strong>4</strong> lựa chọn có <code>**</code> → chọn nhiều; đúng{" "}
              <strong>1</strong> dòng có <code>**</code> trong <strong>4</strong> lựa chọn → MCQ. Dòng <code>//tên nhóm</code> (vd. <code>//3-4</code>) gom câu trong part. Tuỳ chọn <code>[MCQ]</code> <code>[MULTI]</code>{" "}
              <code>[TF]</code> <code>[SA]</code>. Ảnh inline giữ khi import.
            </div>
          </section>
        </div>
        <Modal
          isOpen={partModalOpen}
          title={partEditing ? "Chỉnh sửa part" : "Thêm part"}
          onClose={() => {
            setPartModalOpen(false);
            setPartEditing(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setPartModalOpen(false);
                  setPartEditing(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitPart} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên phần</label>
              <InputField
                type="text"
                value={partForm.tenPhan}
                onChange={(e) => setPartForm((p) => ({ ...p, tenPhan: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
              <InputField
                type="number"
                min={1}
                value={partForm.thuTu}
                onChange={(e) => setPartForm((p) => ({ ...p, thuTu: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={questionModalOpen}
          title={questionEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
          onClose={() => {
            setQuestionModalOpen(false);
            setQuestionEditing(null);
          }}
          maxWidthClassName="max-w-3xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setQuestionModalOpen(false);
                  setQuestionEditing(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitQuestion} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {questionEditing ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/25 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                Chế độ chỉnh sửa: kiểm tra đủ stem, loại câu, đáp án và phần <strong className="font-semibold">Xem trước đầy đủ</strong> phía dưới trước khi lưu.
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
                <InputField
                  type="number"
                  min={1}
                  value={questionForm.thuTu}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, thuTu: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại câu hỏi</label>
                <InputField
                  type="select"
                  value={questionForm.loaiCauHoi}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, loaiCauHoi: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  options={[
                    { value: "mcq", label: "MCQ (một đáp án)" },
                    { value: "multiSelect", label: "Chọn nhiều (4 lựa chọn)" },
                    { value: "trueFalse", label: "Đúng / Sai" },
                    { value: "shortAnswer", label: "Trả lời ngắn" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm câu hỏi</label>
              <InputField
                type="select"
                value={questionForm.deThiMauPhanNhomID}
                onChange={(e) => setQuestionForm((p) => ({ ...p, deThiMauPhanNhomID: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                options={groupSelectOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung câu hỏi (cho phép HTML nếu có ảnh)</label>
              <InputField
                type="textarea"
                rows={questionEditing ? 7 : 5}
                value={questionForm.noiDung}
                onChange={(e) => setQuestionForm((p) => ({ ...p, noiDung: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              {String(questionForm.noiDung || "").trim() ? (
                <div className={`mt-2 border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-64 overflow-auto text-sm bg-gray-50 dark:bg-gray-900/40 ${HTML_IMG_COMPACT}`}>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Xem trước nội dung (đầy đủ)</div>
                  {looksLikeHtml(questionForm.noiDung) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: questionForm.noiDung }} />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{questionForm.noiDung}</div>
                  )}
                </div>
              ) : null}
            </div>

            {questionForm.loaiCauHoi === "mcq" || questionForm.loaiCauHoi === "multiSelect" ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {questionForm.loaiCauHoi === "mcq" ? "Bốn lựa chọn — chọn đáp án đúng (radio)" : "Bốn lựa chọn — tick các đáp án đúng"}
                </div>
                {["A", "B", "C", "D"].map((label, idx) => (
                  <div key={label} className="flex items-start gap-2">
                    {questionForm.loaiCauHoi === "mcq" ? (
                      <input
                        type="radio"
                        name="dapAnDungMcq"
                        className="mt-2 h-4 w-4 shrink-0"
                        checked={Number(questionForm.dapAnDungIndex) === idx}
                        onChange={() => setQuestionForm((p) => ({ ...p, dapAnDungIndex: idx }))}
                        aria-label={`Đáp án đúng ${label}`}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        className="mt-2 h-4 w-4 shrink-0 rounded border-gray-300"
                        checked={!!questionForm.multiCorrect?.[idx]}
                        onChange={(e) => {
                          const next = [...(questionForm.multiCorrect || [false, false, false, false])];
                          next[idx] = e.target.checked;
                          setQuestionForm((p) => ({ ...p, multiCorrect: next }));
                        }}
                        aria-label={`Đáp án đúng ${label}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">{label}</label>
                      <InputField
                        type="textarea"
                        rows={questionEditing ? 4 : 3}
                        value={questionForm.luaChon[idx] || ""}
                        onChange={(e) => {
                          const next = [...(questionForm.luaChon || ["", "", "", ""])];
                          next[idx] = e.target.value;
                          setQuestionForm((p) => ({ ...p, luaChon: next }));
                        }}
                        inputClassName="w-full px-2 py-1.5 text-xs leading-snug border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono min-h-[2.75rem]"
                      />
                      {String(questionForm.luaChon[idx] || "").trim() ? (
                        <div
                          className={`mt-1.5 border rounded-md p-2 max-h-40 overflow-auto text-xs bg-white/60 dark:bg-gray-800/50 ${HTML_IMG_COMPACT} ${
                            questionForm.loaiCauHoi === "mcq" && Number(questionForm.dapAnDungIndex) === idx
                              ? "ring-2 ring-green-500 border-green-300 dark:border-green-700"
                              : questionForm.loaiCauHoi === "multiSelect" && questionForm.multiCorrect?.[idx]
                                ? "ring-2 ring-green-500 border-green-300 dark:border-green-700"
                                : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Xem trước {label}</div>
                          {looksLikeHtml(questionForm.luaChon[idx]) ? (
                            <div dangerouslySetInnerHTML={{ __html: questionForm.luaChon[idx] }} />
                          ) : (
                            <div className="whitespace-pre-wrap">{questionForm.luaChon[idx]}</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {questionForm.loaiCauHoi === "trueFalse" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án đúng</label>
                <InputField
                  type="select"
                  value={questionForm.dapAnDungBoolean ? "true" : "false"}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, dapAnDungBoolean: e.target.value === "true" }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  options={[
                    { value: "true", label: "Đúng" },
                    { value: "false", label: "Sai" },
                  ]}
                />
              </div>
            ) : null}

            {questionForm.loaiCauHoi === "shortAnswer" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án mẫu</label>
                <InputField
                  type="textarea"
                  rows={questionEditing ? 5 : 3}
                  value={questionForm.dapAnDungText}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, dapAnDungText: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giải thích (optional)</label>
              <InputField
                type="textarea"
                rows={questionEditing ? 5 : 3}
                value={questionForm.giaiThich}
                onChange={(e) => setQuestionForm((p) => ({ ...p, giaiThich: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {String(questionForm.giaiThich || "").trim() ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-auto text-sm bg-gray-50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Xem trước giải thích</div>
                  {looksLikeHtml(questionForm.giaiThich) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: questionForm.giaiThich }} />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{questionForm.giaiThich}</div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 space-y-3">
              <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Xem trước đầy đủ (theo form hiện tại)</div>
              <div className="text-sm text-indigo-800 dark:text-indigo-200">
                <span className="font-medium">Loại:</span> {questionForm.loaiCauHoi}
                {" · "}
                <span className="font-medium">Nhóm:</span>{" "}
                {groupSelectOptions.find((o) => String(o.value) === String(questionForm.deThiMauPhanNhomID || ""))?.label || "—"}
              </div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">{questionAnswerSummaryLine(questionForm)}</div>
              <div className="border-t border-indigo-200/80 dark:border-indigo-700/80 pt-3 space-y-2">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Stem</div>
                <div className={`max-h-56 overflow-auto rounded-lg border border-white/80 dark:border-gray-600 bg-white dark:bg-gray-900/50 p-3 text-sm ${HTML_IMG_COMPACT}`}>
                  {String(questionForm.noiDung || "").trim() ? (
                    looksLikeHtml(questionForm.noiDung) ? (
                      <div dangerouslySetInnerHTML={{ __html: questionForm.noiDung }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{questionForm.noiDung}</div>
                    )
                  ) : (
                    <span className="text-gray-400 italic">(chưa có nội dung)</span>
                  )}
                </div>
              </div>
              {questionForm.loaiCauHoi === "mcq" || questionForm.loaiCauHoi === "multiSelect" ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Bốn lựa chọn</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((label, idx) => {
                      const raw = String(questionForm.luaChon[idx] || "").trim();
                      const isCorrectMcq = questionForm.loaiCauHoi === "mcq" && Number(questionForm.dapAnDungIndex) === idx;
                      const isCorrectMulti = questionForm.loaiCauHoi === "multiSelect" && !!questionForm.multiCorrect?.[idx];
                      const mark = isCorrectMcq || isCorrectMulti;
                      return (
                        <div
                          key={label}
                          className={`rounded-lg border p-2 text-xs max-h-36 overflow-auto ${HTML_IMG_COMPACT} ${
                            mark ? "border-green-500 ring-1 ring-green-500/50 bg-green-50/80 dark:bg-green-950/30" : "border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-900/40"
                          }`}
                        >
                          <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                            {label}
                            {mark ? <span className="ml-1 text-green-700 dark:text-green-400">(đúng)</span> : null}
                          </div>
                          {raw ? (
                            looksLikeHtml(questionForm.luaChon[idx]) ? (
                              <div dangerouslySetInnerHTML={{ __html: questionForm.luaChon[idx] }} />
                            ) : (
                              <div className="whitespace-pre-wrap">{questionForm.luaChon[idx]}</div>
                            )
                          ) : (
                            <span className="text-gray-400 italic">(trống)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {String(questionForm.giaiThich || "").trim() ? (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Giải thích</div>
                  <div className={`max-h-40 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 p-2 text-sm ${HTML_IMG_COMPACT}`}>
                    {looksLikeHtml(questionForm.giaiThich) ? (
                      <div dangerouslySetInnerHTML={{ __html: questionForm.giaiThich }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{questionForm.giaiThich}</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tệp đính kèm (optional)</label>
              <FileDropZone
                multiple
                title="Kéo thả file vào đây hoặc bấm để chọn"
                hint="Có thể chọn nhiều file; trùng id sẽ gộp."
                onPickFiles={async (files) => {
                  if (!files.length) return;
                  const uploaded = await uploadFiles(files);
                  if (!uploaded.length) return;
                  setQuestionFiles((prev) => {
                    const map = new Map((prev || []).map((f) => [String(f?._id), f]));
                    uploaded.forEach((f) => {
                      if (!f?._id) return;
                      map.set(String(f._id), f);
                    });
                    return Array.from(map.values());
                  });
                }}
              />
              {questionFiles?.length ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60">
                    Đã đính kèm ({questionFiles.length})
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {questionFiles.map((f) => (
                      <li key={String(f?._id)} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {f?.originalName || f?.url || f?._id}
                          </div>
                          {f?.url ? (
                            <a
                              href={`${API_BASE}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Mở file
                            </a>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionFiles((prev) => (prev || []).filter((x) => String(x?._id) !== String(f?._id)))}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 shrink-0"
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Chưa có file nào.</p>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={importDocxOpen}
          title="Import câu hỏi từ Word (.docx)"
          onClose={() => {
            if (!importCommitting) {
              setImportDocxOpen(false);
              setImportRows([]);
              setImportErrors([]);
            }
          }}
          maxWidthClassName="max-w-4xl"
          footer={
            <>
              <button
                type="button"
                disabled={importCommitting}
                onClick={() => {
                  setImportDocxOpen(false);
                  setImportRows([]);
                  setImportErrors([]);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={importCommitting || !importRows.length}
                onClick={commitImportDocx}
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importCommitting ? "Đang nhập..." : `Nhập ${importRows.length} câu`}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              Đoạn <strong>in đậm</strong> mở đầu mỗi câu. Có thể thêm đoạn có <strong>ảnh</strong> (không in đậm) ngay sau stem. Các đoạn tiếp theo là lựa chọn; đáp đúng MCQ/multi:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">**</code> ở đầu dòng hoặc bọc <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">**cả cụm**</code>.{" "}
              <strong>Không gõ [MCQ]/[MULTI]/…</strong> thì hệ thống suy luận: có tag <code>[Đúng]</code>/<code>[Đ]</code>/<code>[đ]</code>/<code>[d]</code> hoặc <code>[Sai]</code>/<code>[S]</code>/<code>[s]</code> trong stem hoặc đáp →{" "}
              <strong>đúng/sai</strong> (không cần <code>[TF]</code>); hoặc hai dòng Đúng/Sai với đúng một dòng có <code>**</code>; hoặc <strong>một</strong> dòng đáp <strong>không</strong> <code>**</code> → <strong>trả lời ngắn</strong>;{" "}
              <strong>4</strong> lựa chọn và <strong>≥2</strong> dòng có <code>**</code> → <strong>chọn nhiều</strong>; <strong>4</strong> lựa chọn và đúng <strong>1</strong> <code>**</code> → MCQ. Tiền tố{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">[MCQ]</code> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">[MULTI]</code> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">[TF]</code>{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">[SA]</code> vẫn dùng được để ép kiểu như trước (vd. <code>[TF]</code> một dòng kèm <code>[Đ]</code> sau <code>[TF]</code>).
            </p>
            <p>
              <strong>Nhóm trong part:</strong> một dòng riêng <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">//tên nhóm</code> (ví dụ{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">//3-4</code>) — các câu phía sau thuộc nhóm đó cho đến dòng{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">//</code> khác. Nhóm chưa có sẽ được tạo khi nhập.
            </p>
            <WordImportVisualSample />
            <div>
              <label className="block text-sm font-medium mb-2">File Word (.docx)</label>
              <FileDropZone
                multiple={false}
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={importLoading || importCommitting}
                title="Kéo thả file .docx vào đây hoặc bấm để chọn"
                hint="Chỉ một file mỗi lần; sau khi chọn hệ thống sẽ trích HTML."
                onPickFiles={(files) => {
                  const f = files[0];
                  if (f) runImportDocxFile(f);
                }}
              />
              {importLoading ? <div className="mt-2 text-amber-600 dark:text-amber-400">Đang trích HTML từ Word...</div> : null}
            </div>
            {importErrors.length ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-900 dark:text-amber-100 text-xs">
                {importErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            ) : null}
            {importRows.length ? (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="text-left p-2 w-10">#</th>
                      <th className="text-left p-2 w-24">Loại</th>
                      <th className="text-left p-2 w-28">Nhóm</th>
                      <th className="text-left p-2">Stem / lựa chọn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-600 align-top">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 whitespace-nowrap">{row.loaiCauHoi}</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                          {row.importGroupName ? String(row.importGroupName) : "—"}
                        </td>
                        <td className="p-2">
                          <div
                            className={`mb-1 max-h-28 overflow-auto border border-gray-100 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800/50 ${HTML_IMG_COMPACT}`}
                            dangerouslySetInnerHTML={{ __html: row.noiDung || "" }}
                          />
                          {Array.isArray(row.luaChon) && row.luaChon.length ? (
                            <ul className="list-disc ml-4 space-y-1">
                              {row.luaChon.map((c, j) => (
                                <li key={j} className={`max-h-28 overflow-auto ${HTML_IMG_COMPACT}`} dangerouslySetInnerHTML={{ __html: c || "" }} />
                              ))}
                            </ul>
                          ) : row.loaiCauHoi === "shortAnswer" ? (
                            <div className="text-gray-500 italic">Đáp án: {row.dapAnDungText}</div>
                          ) : row.loaiCauHoi === "trueFalse" ? (
                            <div className="text-gray-500">→ {row.dapAnDungBoolean ? "Đúng" : "Sai"}</div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </Modal>

        {/* Group modal */}
        <Modal
          isOpen={groupModalOpen}
          title={groupEditing ? "Chỉnh sửa nhóm" : "Thêm nhóm"}
          maxWidthClassName="max-w-xl"
          onClose={() => {
            setGroupModalOpen(false);
            setGroupEditing(null);
            setGroupFiles([]);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setGroupModalOpen(false);
                  setGroupEditing(null);
                  setGroupFiles([]);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitGroup} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhóm</label>
              <InputField
                type="text"
                value={groupForm.tenNhom}
                onChange={(e) => setGroupForm((p) => ({ ...p, tenNhom: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
              <InputField
                type="number"
                min={1}
                value={groupForm.thuTu}
                onChange={(e) => setGroupForm((p) => ({ ...p, thuTu: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File cho nhóm (optional)</label>
              <FileDropZone
                multiple
                title="Kéo thả file vào đây hoặc bấm để chọn"
                hint="Có thể chọn nhiều file."
                onPickFiles={async (files) => {
                  if (!files.length) return;
                  const uploaded = await uploadFiles(files);
                  if (!uploaded.length) return;
                  setGroupFiles((prev) => {
                    const map = new Map((prev || []).map((f) => [String(f?._id), f]));
                    uploaded.forEach((f) => {
                      if (!f?._id) return;
                      map.set(String(f._id), f);
                    });
                    return Array.from(map.values());
                  });
                }}
              />

              {groupFiles?.length ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60">
                    Đã đính kèm ({groupFiles.length})
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {groupFiles.map((f) => (
                      <li key={String(f?._id)} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {f?.originalName || f?.url || f?._id}
                          </div>
                          {f?.url ? (
                            <a
                              href={`${API_BASE}${f.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Mở file
                            </a>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setGroupFiles((prev) => (prev || []).filter((x) => String(x?._id) !== String(f?._id)))}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 shrink-0"
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Chưa có file nào.</p>
              )}
            </div>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={confirmDeleteGroupOpen}
          title="Xác nhận xóa nhóm"
          message="Xóa nhóm này? Nếu nhóm còn câu hỏi, hệ thống sẽ chặn."
          onConfirm={deleteGroup}
          onCancel={() => {
            setConfirmDeleteGroupOpen(false);
            setDeleteGroupId(null);
          }}
          confirmText="Xóa"
        />

        <ConfirmModal
          isOpen={confirmDeletePartOpen}
          title="Xác nhận xóa phần"
          message="Xóa phần này? Hệ thống sẽ chặn nếu xóa làm đề không còn câu hỏi."
          onConfirm={deletePart}
          onCancel={() => {
            setConfirmDeletePartOpen(false);
            setDeletePartId(null);
          }}
          confirmText="Xóa"
        />

        <ConfirmModal
          isOpen={confirmDeleteQuestionOpen}
          title="Xác nhận xóa câu hỏi"
          message="Xóa câu hỏi này? Hệ thống sẽ chặn nếu xóa làm đề không còn câu hỏi."
          onConfirm={deleteQuestion}
          onCancel={() => {
            setConfirmDeleteQuestionOpen(false);
            setDeleteQuestionId(null);
          }}
          confirmText="Xóa"
        />
    </div>
  );
}

export default function SampleTestsPage() {
  const { token } = useAuth();
  const notify = useNotification();

  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterChungChi, setFilterChungChi] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const [mode, setMode] = useState("list"); // list | create | edit
  const [activeTestId, setActiveTestId] = useState(null);
  const [activeTest, setActiveTest] = useState(null);

  // delete modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_COURSE_TYPES = `${API_BASE}/api/course-types`;
  const API_COURSES = `${API_BASE}/api/admin/courses`;
  const API_SAMPLE_TESTS = `${API_BASE}/api/admin/sample-tests`;
  const FILE_UPLOAD_API_URL = `${API_BASE}/api/admin/files/upload`;

  const chungChiOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả" },
      { value: "TOEIC", label: "TOEIC" },
      { value: "IELTS", label: "IELTS" },
    ],
    []
  );

  const fetchAll = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [ctRes, coursesRes, testsRes] = await Promise.all([
        fetch(API_COURSE_TYPES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_COURSES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_SAMPLE_TESTS}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [ctJson, coursesJson, testsJson] = await Promise.all([ctRes.json(), coursesRes.json(), testsRes.json()]);

      if (!ctRes.ok || !ctJson.success) throw new Error(ctJson.message || "Không tải được course types.");
      if (!coursesRes.ok || !coursesJson.success && coursesJson.success !== undefined) {
        // một số endpoint không trả success; admin/courses có success true
      }
      if (!testsRes.ok || !testsJson.success) throw new Error(testsJson.message || "Không tải được đề thi mẫu.");

      setCourseTypes(Array.isArray(ctJson.data) ? ctJson.data : []);
      setCourses(Array.isArray(coursesJson.data) ? coursesJson.data : []);
      setTests(Array.isArray(testsJson.data) ? testsJson.data : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const cc = String(t.chungChi || "").trim().toUpperCase();
      const matchesCC = filterChungChi === "all" || cc === filterChungChi;
      const matchesQ = !searchQ.trim() ? true : String(t.tenDe || "").toLowerCase().includes(searchQ.trim().toLowerCase()) || String(t.moTa || "").toLowerCase().includes(searchQ.trim().toLowerCase());
      return matchesCC && matchesQ;
    });
  }, [tests, filterChungChi, searchQ]);

  const refreshTests = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterChungChi !== "all") params.set("chungChi", filterChungChi);
      if (searchQ.trim()) params.set("q", searchQ.trim());

      const res = await fetch(`${API_SAMPLE_TESTS}${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được danh sách đề.");
      setTests(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải danh sách.");
    }
  };

  useEffect(() => {
    // refresh list only when leaving edit/create
    if (mode === "list") refreshTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filterChungChi, searchQ]);

  const openCreate = () => {
    setActiveTestId(null);
    setActiveTest({
      tenDe: "",
      khoaHocID: "",
      chungChi: "TOEIC",
      capDo: "easy",
      thoiGianLamBai: 60,
      moTa: "",
      parts: [],
    });
    setMode("create");
  };

  const openEdit = (id) => {
    setActiveTestId(id);
    setActiveTest(null);
    setMode("edit");
  };

  useEffect(() => {
    if (!token) return;
    if (mode !== "edit" || !activeTestId) return;
    const run = async () => {
      try {
        const res = await fetch(`${API_SAMPLE_TESTS}/${activeTestId}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết đề.");
        setActiveTest(json.data);
      } catch (e) {
        console.error(e);
        notify.error(e?.message || "Lỗi tải chi tiết.");
      }
    };
    run();
  }, [mode, activeTestId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDelete = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    try {
      const res = await fetch(`${API_SAMPLE_TESTS}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa.");
      notify.success("Đã xóa đề thi mẫu.");
      setConfirmDeleteOpen(false);
      setDeleteId(null);
      setMode("list");
      refreshTests();
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa.");
    }
  };

  if (mode === "list") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <AdminPageTitle
              className="mb-0 flex-1"
              title="Quản lý đề thi mẫu"
              subtitle="Tạo/sửa/xóa đề TOEIC/IELTS và quản lý phần/câu hỏi"
            />
            <button type="button" onClick={openCreate} className="admin-btn-accent h-fit shrink-0 self-start sm:self-center">
              <FiPlus className="shrink-0" />
              Thêm đề
            </button>
          </div>

          <AdminCard className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-1/2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <InputField
                type="text"
                name="q"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm theo tên/mô tả..."
                inputClassName="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 w-full lg:w-auto">
              <InputField
                type="select"
                name="chungChi"
                value={filterChungChi}
                onChange={(e) => setFilterChungChi(e.target.value)}
                options={chungChiOptions}
                inputClassName="border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Tên đề</th>
                    <th className="px-6 py-3">Chứng chỉ</th>
                    <th className="px-6 py-3">Cấp độ</th>
                    <th className="px-6 py-3">Thời gian</th>
                    <th className="px-6 py-3">Câu hỏi</th>
                    <th className="px-6 py-3">Ngày tạo</th>
                    <th className="px-6 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 dark:text-gray-400">Đang tải...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-red-500 dark:text-red-400">{error}</td>
                    </tr>
                  ) : filteredTests.length ? (
                    filteredTests.map((t) => (
                      <tr key={t._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/40">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{t.tenDe}</td>
                        <td className="px-6 py-4">{String(t.chungChi || "").toUpperCase()}</td>
                        <td className="px-6 py-4">{t.capDo}</td>
                        <td className="px-6 py-4">{t.thoiGianLamBai} phút</td>
                        <td className="px-6 py-4">{t.questionCount ?? 0}</td>
                        <td className="px-6 py-4">{t.createdAt ? formatDateDdMmYyyy(t.createdAt) : "—"}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(t._id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-yellow-400/90 hover:bg-yellow-400 text-white"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(t._id)}
                            className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-500 hover:bg-red-600 text-white"
                            title="Xóa"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 dark:text-gray-400">Không có đề thi mẫu phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <ConfirmModal
            isOpen={confirmDeleteOpen}
            title="Xác nhận xóa"
            message="Bạn có chắc muốn xóa đề thi mẫu này không?"
            onConfirm={confirmDelete}
            onCancel={() => {
              setConfirmDeleteOpen(false);
              setDeleteId(null);
            }}
            confirmText="Xóa"
          />
      </div>
    );
  }

  if (!activeTest) {
    return (
      <div className="p-4 md:p-6 min-h-full">
        <div className="text-center text-gray-600">Đang tải chi tiết...</div>
      </div>
    );
  }
    return (
    <SampleTestEditor
      token={token}
      notify={notify}
      mode={mode}
      activeTestId={activeTestId}
      activeTest={activeTest}
      courses={courses}
      courseTypes={courseTypes}
      API_SAMPLE_TESTS={API_SAMPLE_TESTS}
      FILE_UPLOAD_API_URL={FILE_UPLOAD_API_URL}
      FILE_EXTRACT_DOCX_HTML_URL={`${API_BASE}/api/admin/files/extract-docx-html`}
      onBack={() => {
        setMode("list");
        setActiveTestId(null);
        setActiveTest(null);
        refreshTests();
      }}
    />
  );
}

