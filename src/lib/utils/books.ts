import { asset } from "$app/paths";
import type { BookItem } from "$lib/types";

// Path to the local asset used as a fallback cover
export const noCover = asset("/no-cover.svg");

export type { BookItem };

// Removes invalid characters and keeps 10/13 digits
export function sanitizeISBN(raw: unknown): string {
    const s = String(raw || "")
        .toUpperCase()
        .replace(/[^0-9X]/g, "");
    return s.length === 10 || s.length === 13 ? s : "";
}

// Picks a valid ISBN among multiple possible dataset fields
export function bestISBN(b: any): string {
    return (
        sanitizeISBN((b && (b.ISBN13 || b["ISBN13"])) || "") ||
        sanitizeISBN((b && (b.ISBN || b["ISBN"])) || "") ||
        sanitizeISBN((b && (b.ISBN10 || b["ISBN10"])) || "")
    );
}

// Removes groups between parentheses/brackets from text
export function stripParentheticals(str: string): string {
    return (str || "").replace(/\s*[\(\[].*?[\)\]]/g, "");
}

// Simple normalization of lowercase, diacritics, quotes and spaces
export const normalizeSimple = (str: string): string =>
    (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/"|”|“|‘|’/g, "")
        .replace(/\s+/g, " ")
        .trim();

// Builds the Open Library cover URL; 404 if it doesn't exist (default=false)
export function getOpenLibraryCover(
    isbn: string,
    size: "S" | "M" | "L" = "L"
): string {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
}

// Obtains an absolute URL or static asset path from book data
export function getUserCover(b: any): string {
    let cand =
        b?.userCover ||
        b?.cover ||
        b?.Cover ||
        b?.["userCover"] ||
        b?.["Cover"];
    if (typeof cand !== "string") return "";
    cand = cand.trim();
    if (!cand) return "";
    // If it's an absolute URL (http/https/data), leave as is
    if (/^(?:https?:)?\/\//i.test(cand) || cand.startsWith("data:"))
        return cand;
    // Otherwise, treat as a static asset path
    const prefixed = cand.startsWith("/") ? cand : `/${cand}`;
    return asset(prefixed);
}

// Parse integer with default value
export function toInt(n: unknown, fallback = 0): number {
    const x = parseInt(String(n), 10);
    return Number.isFinite(x) ? x : fallback;
}

// Normalized string used for text filtering
export function getSearchString(title: string, author: string): string {
    return normalizeSimple(
        stripParentheticals(`${title || ""} ${author || ""}`)
    );
}
