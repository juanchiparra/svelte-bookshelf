<script lang="ts">
    import { writable } from "svelte/store";
    import type { Writable } from "svelte/store";
    export let data: { booksData: any[] };
    import Shelf from "$lib/components/Shelf.svelte";
    import Filters from "$lib/components/Filters.svelte";
    import {
        noCover,
        bestISBN,
        getOpenLibraryCover,
        getUserCover,
        toInt,
        getSearchString,
    } from "$lib/utils/books";
    import type { BookItem } from "$lib";
    import {
        ABOVE_FOLD_COUNT,
        MAX_STARS,
        createFilters,
        filterBooks,
        sortBooks,
    } from "$lib";
    import "$lib/styles/global.css";

    // Filters store and debounced derived for search
    const { store: filtersStore, textDebounced } = createFilters();

    // Cover strategy: user > Open Library by ISBN > local SVG
    function getBookCover(book: any): string {
        // Prefer user-provided cover (static/covers)
        const userUrl = getUserCover(book);
        if (userUrl) return userUrl;
        // Fallback to Open Library cover using the ISBN
        const isbn = bestISBN(book);
        if (isbn) return getOpenLibraryCover(isbn);
        // Final fallback: local SVG (noCover)
        return noCover;
    }

    // Normalize and type CSV records into BookItem
    const booksStore: Writable<BookItem[]> = writable(
        (data.booksData as any[]).map((b) => {
            const exclusiveShelfRaw = String(b["Exclusive Shelf"] || "");
            const shelfLower = exclusiveShelfRaw.toLowerCase();
            const ratingRaw = toInt(b["My Rating"], 0);
            const reviewRaw = String(b["My Review"] || "").trim();
            const dateRead = b["Date Read"] as string | null | undefined;

            // Read state: read date, rating or review, or read shelf
            const derivedRead =
                !!dateRead ||
                ratingRaw > 0 ||
                !!reviewRaw ||
                shelfLower === "read";

            // If not read, it cannot have rating or review
            const myRating = derivedRead ? ratingRaw : 0;
            const myReview = derivedRead ? reviewRaw : "";

            // If it's read but the shelf says 'to-read', align to 'read' in the user interface
            const exclusiveShelf =
                derivedRead && shelfLower === "to-read"
                    ? "read"
                    : exclusiveShelfRaw;

            return {
                bookId: b["Book Id"],
                title: b["Title"],
                author: b["Author"],
                myRating,
                numberOfPages: toInt(b["Number of Pages"], 0),
                yearPublished: toInt(b["Year Published"], 0),
                dateRead: dateRead ?? null,
                originalPublicationYear: toInt(
                    b["Original Publication Year"],
                    0
                ),
                userCover: getUserCover(b),
                cover: getBookCover(b),
                read: derivedRead,
                exclusiveShelf,
                bookshelves: b["Bookshelves"]
                    ? String(b["Bookshelves"])
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                ISBN: b["ISBN"],
                myReview,
                searchHaystack: getSearchString(b["Title"], b["Author"]),
            } satisfies BookItem;
        })
    );
    let books: BookItem[] = [];
    booksStore.subscribe((value) => (books = value));

    // Year and pages range calculated from the dataset
    $: minYear =
        books && books.length
            ? Math.min(
                  ...books.map(
                      (b) => b.yearPublished || b.originalPublicationYear
                  )
              )
            : 1900;
    $: maxYear =
        books && books.length
            ? Math.max(
                  ...books.map(
                      (b) => b.yearPublished || b.originalPublicationYear
                  )
              )
            : new Date().getFullYear();
    $: minPages =
        books && books.length
            ? Math.min(...books.map((b) => b.numberOfPages))
            : 0;
    $: maxPages =
        books && books.length
            ? Math.max(...books.map((b) => b.numberOfPages))
            : 1000;

    // Initialize sliders with dataset minimums
    $: if (books && books.length) {
        if ($filtersStore.yearMin === 1900 && typeof minYear === "number") {
            filtersStore.update((s) => ({ ...s, yearMin: minYear }));
        }
        if ($filtersStore.pagesMin === 0 && typeof minPages === "number") {
            filtersStore.update((s) => ({ ...s, pagesMin: minPages }));
        }
    }

    // Shelf options (exclusive) deduplicated and sorted
    $: shelfOptions = [
        "All",
        ...Array.from(
            new Set(
                (books || [])
                    .map((b) => (b.exclusiveShelf || "").toLowerCase())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b)),
    ];

    // Debounced search text from the store
    let filterTextDebounced: string = "";
    $: {
        const unsub = textDebounced.subscribe(
            (v: string) => (filterTextDebounced = v)
        );
        unsub; // keep reactive block alive
    }

    // Pipeline: filter -> sort
    $: filteredBooks = filterBooks(books, $filtersStore, filterTextDebounced);

    $: sortedBooks = sortBooks(
        filteredBooks,
        $filtersStore.sortKey,
        $filtersStore.sortDir
    );
</script>

<svelte:head>
    <link
        rel="preconnect"
        href="https://covers.openlibrary.org"
        crossorigin="anonymous"
    />
    <link rel="dns-prefetch" href="//covers.openlibrary.org" />
</svelte:head>

<Filters
    filters={filtersStore}
    {shelfOptions}
    {minYear}
    {maxYear}
    {minPages}
    {maxPages}
    maxStars={MAX_STARS}
/>

<div class="gallery" aria-live="polite" aria-busy={filteredBooks.length === 0}>
    {#each sortedBooks as book, i (book.bookId || `${book.title}|${book.author}`)}
        <Shelf
            {book}
            index={i}
            aboveFoldCount={ABOVE_FOLD_COUNT}
            reviewMode={$filtersStore.review === "with"}
        />
    {/each}
</div>
