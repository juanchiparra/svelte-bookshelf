import { writable, derived, type Writable } from "svelte/store";
import type {
    FiltersState,
    BookItem,
    ReviewFilter,
    SortDir,
    SortKey,
} from "$lib/types";
import { normalizeSimple, stripParentheticals } from "$lib/utils/books";

// Filters state and filtering/sorting utilities for the gallery

// Centralized filters store with debounced text to avoid filtering on every keystroke
export function createFilters(initial: Partial<FiltersState> = {}) {
    const state: FiltersState = {
        text: "",
        shelf: "All",
        rating: 0,
        yearMin: 1900,
        pagesMin: 0,
        review: "all",
        sortKey: "title",
        sortDir: "asc",
        ...initial,
    };

    const store: Writable<FiltersState> = writable(state);

    // Derived that emits the text after 120ms: avoids recomputing filters too fast
    const textDebounced = derived(store, ($s, set: (v: string) => void) => {
        const t = setTimeout(() => set($s.text), 120);
        return () => clearTimeout(t);
    });

    return { store, textDebounced };
}

// Applies all filtering rules over the books list
export function filterBooks(
    books: BookItem[],
    filters: FiltersState,
    textDebounced: string
): BookItem[] {
    const query = (textDebounced || "").trim();
    const tokens = normalizeSimple(stripParentheticals(query))
        .split(/\s+/)
        .filter(Boolean);

    return books.filter((book) => {
        const haystack =
            book.searchHaystack ||
            normalizeSimple(
                stripParentheticals(`${book.title} ${book.author}`)
            );
        const matchesText =
            tokens.length === 0 || tokens.every((t) => haystack.includes(t));
        const matchesShelf =
            filters.shelf === "All" ||
            (book.exclusiveShelf || "").toLowerCase() ===
                filters.shelf.toLowerCase();

        // Rating only applies to read books
        const matchesRating =
            filters.rating > 0
                ? book.read && Math.floor(book.myRating) === filters.rating
                : true;
        // Unknown years pass; only require minimum when there's a positive year
        const y = book.yearPublished || book.originalPublicationYear;
        const hasYear = typeof y === "number" && y > 0;
        const matchesYear = hasYear ? y >= filters.yearMin : true;
        const matchesPages = book.numberOfPages >= filters.pagesMin;
        const hasReview = !!(book.myReview && book.myReview.trim());
        // Reviews are only valid on read books
        const matchesReview =
            filters.review === "all"
                ? true
                : filters.review === "with"
                ? book.read && hasReview
                : book.read
                ? !hasReview
                : true;
        return (
            matchesText &&
            matchesShelf &&
            matchesRating &&
            matchesYear &&
            matchesPages &&
            matchesReview
        );
    });
}

// Use a stable sort, breaking ties by title
export function sortBooks(
    list: BookItem[],
    key: SortKey,
    dir: SortDir
): BookItem[] {
    const arr = list.slice();
    arr.sort((a, b) => {
        let r = 0;
        if (key === "rating") {
            // Unread books (rating 0) at the end when ordering by rating
            const ar = a.read ? a.myRating : -Infinity;
            const br = b.read ? b.myRating : -Infinity;
            r = ar - br;
            if (r === 0) {
                const ta = normalizeSimple(a.title);
                const tb = normalizeSimple(b.title);
                r = ta.localeCompare(tb, undefined, { sensitivity: "base" });
            }
        } else {
            const va = normalizeSimple(key === "title" ? a.title : a.author);
            const vb = normalizeSimple(key === "title" ? b.title : b.author);
            r = va.localeCompare(vb, undefined, { sensitivity: "base" });
        }
        return dir === "asc" ? r : -r;
    });
    return arr;
}
