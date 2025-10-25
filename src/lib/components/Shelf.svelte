<script lang="ts">
    import {
        noCover,
        getOpenLibraryCover,
        sanitizeISBN,
    } from "$lib/utils/books";
    import { onDestroy } from "svelte";
    import type { BookItem } from "$lib";
    export let book: BookItem;
    export let index: number = 0;
    export let aboveFoldCount: number = 12;
    export let reviewMode: boolean = false;

    // Split title into main part and parentheses (if any)
    function getTitleParts(title: string): { main: string; paren: string } {
        const t = String(title || "");
        const m = t.match(/^(.*?)\s*(\(.*\))\s*$/);
        if (m) {
            return { main: m[1]?.trim() || t, paren: m[2]?.trim() || "" };
        }
        return { main: t, paren: "" };
    }

    let imgEl: HTMLImageElement | null = null;
    let _flipTimer: number | undefined = undefined;
    // Switch images below the fold from lazy to eager loading after a delay
    $: {
        if (_flipTimer) clearTimeout(_flipTimer);
        if (imgEl && index >= aboveFoldCount) {
            _flipTimer = setTimeout(() => {
                try {
                    if (imgEl && imgEl.loading === "lazy" && !imgEl.complete) {
                        imgEl.loading = "eager";
                    }
                } catch {}
            }, 2500);
        }
    }
    onDestroy(() => {
        if (_flipTimer) clearTimeout(_flipTimer);
    });

    let titleParts: { main: string; paren: string } = { main: "", paren: "" };
    $: titleParts = getTitleParts(book?.title);
</script>

<div
    class="book {book.read ? 'read' : ''} {reviewMode && book.myReview
        ? 'reviews-mode'
        : ''}"
>
    <div class="cover">
        {#if book.cover}
            <img
                src={book.cover}
                alt={`Cover of ${book.title}`}
                loading={index < aboveFoldCount ? "eager" : "lazy"}
                fetchpriority={index < aboveFoldCount ? "high" : "auto"}
                decoding="async"
                sizes="(max-width: 600px) 90vw, (max-width: 900px) 120px, 160px"
                width="160"
                height="260"
                bind:this={imgEl}
                on:load={(e) => {
                    const el = e.currentTarget;
                    if (el instanceof HTMLImageElement) {
                        // If the image has no intrinsic size, treat it as broken and apply fallbacks
                        if (!el.naturalWidth || !el.naturalHeight) {
                            if (el.src.includes("covers.openlibrary.org")) {
                                if (!el.src.endsWith(noCover)) el.src = noCover;
                            } else {
                                const isbn = sanitizeISBN(book.ISBN);
                                if (isbn) {
                                    el.src = getOpenLibraryCover(isbn);
                                } else if (!el.src.endsWith(noCover)) {
                                    el.src = noCover;
                                }
                            }
                        }
                    }
                }}
                on:error={(e) => {
                    const el = e.currentTarget;
                    if (el instanceof HTMLImageElement) {
                        // If the local cover fails, try Open Library by ISBN; if Open Library fails, use noCover
                        if (el.src.includes("covers.openlibrary.org")) {
                            if (!el.src.endsWith(noCover)) el.src = noCover;
                        } else {
                            const isbn = sanitizeISBN(book.ISBN);
                            if (isbn) {
                                el.src = getOpenLibraryCover(isbn);
                            } else if (!el.src.endsWith(noCover)) {
                                el.src = noCover;
                            }
                        }
                    }
                }}
            />
        {/if}
        {#if !reviewMode}
            <div class="info-overlay">
                <div class="overlay-content">
                    {#key book.title}
                        {#if titleParts.paren}
                            <strong class="title-main">{titleParts.main}</strong
                            >
                            <span class="title-sub">{titleParts.paren}</span>
                        {:else}
                            <strong class="title-main">{titleParts.main}</strong
                            >
                        {/if}
                    {/key}
                    <span>{book.author}</span>
                    <span>Rating: {book.myRating}</span>
                    <span>Pages: {book.numberOfPages}</span>
                    <span>Year: {book.yearPublished}</span>
                    {#if book.bookshelves && book.bookshelves.length}
                        <span>Shelves: {book.bookshelves.join(", ")}</span>
                    {:else}
                        <span
                            >Shelf: {(
                                book.exclusiveShelf || ""
                            ).toLowerCase()}</span
                        >
                    {/if}
                </div>
            </div>
        {/if}
    </div>
    {#if reviewMode && book.myReview}
        <div class="info-panel">
            {#key book.title}
                {#if titleParts.paren}
                    <strong class="title-main">{titleParts.main}</strong>
                    <span class="title-sub">{titleParts.paren}</span>
                {:else}
                    <strong class="title-main">{titleParts.main}</strong>
                {/if}
            {/key}
            <div class="review-text">{book.myReview}</div>
        </div>
    {/if}
</div>

<style>
    .book {
        flex: 1 1 220px;
        max-width: 220px;
        min-width: 180px;
        min-height: 240px;
        margin: 0;
        background: transparent;
        border-radius: 10px;
        box-shadow: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        overflow: hidden;
        justify-content: flex-start;
        transition:
            box-shadow 0.1s,
            border-color 0.1s;
        content-visibility: auto;
        contain-intrinsic-size: 300px;
    }
    .cover {
        position: relative;
        display: inline-block;
        overflow: hidden;
        border-radius: 6px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
        width: 160px;
        height: 260px;
        box-shadow: 0 1px 8px #0008;
    }
    .book img {
        width: 160px;
        height: 260px;
        aspect-ratio: 8 / 13;
        object-fit: cover;
        border-radius: 0;
        box-shadow: 0 1px 8px #0008;
        margin: 0 auto;
        display: block;
        background: transparent;
        border: 0;
        transition: filter 0.2s;
    }
    .book:hover img {
        filter: brightness(0.4) blur(1px);
    }

    .info-overlay {
        width: 100%;
        height: 100%;
        background: rgba(24, 26, 32, 0.7);
    color: var(--color-text-strong);
        border-radius: inherit;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        position: absolute;
        inset: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 0.7em;
        text-align: center;
        word-break: break-word;
        overflow-wrap: anywhere;
        hyphens: auto;
    }
    .overlay-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin-left: auto;
        margin-right: auto;
    }

    .info-overlay strong,
    .info-overlay span {
        margin: 0.1rem 0;
        text-align: center;
        max-width: 95%;
        margin-left: auto;
        margin-right: auto;
    }
    .title-main {
        display: block;
    }
    .title-sub {
        display: block;
        margin-top: 0.05rem;
        opacity: 0.95;
    }
    .book:hover .info-overlay {
        opacity: 1;
        pointer-events: auto;
    }

    .book.reviews-mode {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 2rem;
        flex: 0 1 100%;
        max-width: 50%;
        min-width: 320px;
        background: #1b1e24;
        border: 1px solid #2a2f37;
        border-radius: 10px;
        box-shadow: 0 2px 10px #0007;
        padding: 0.8rem;
        align-items: center;
        margin: 0 auto;
    }
    .book.reviews-mode:nth-child(odd) {
        background: #181b21;
    }
    .book.reviews-mode .info-panel {
        position: static;
        opacity: 1;
        pointer-events: auto;
        background: transparent;
        padding: 0;
        align-items: flex-start;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        width: 95%;
    }
    .book.reviews-mode:hover .info-panel {
        opacity: 1;
    }
    .book.reviews-mode img {
        width: 160px;
        height: 260px;
        object-fit: cover;
        border-radius: 6px;
        margin: 0;
    }
    .book.reviews-mode:hover img {
        filter: none;
    }
    .review-text {
        color: #ddd;
        font-size: 0.95em;
        line-height: 1.5;
        white-space: pre-wrap;
        width: 100%;
    }

    @media (max-width: 900px) {
        .book {
            min-width: 140px;
            max-width: 160px;
            min-height: 220px;
        }
        .cover {
            width: 120px;
            height: 195px;
        }
        .book img {
            width: 120px;
            height: 195px;
        }
        .book.reviews-mode {
            grid-template-columns: 120px 1fr;
            gap: 1rem;
            max-width: 720px;
            width: 100%;
        }
    }
    @media (max-width: 600px) {
        .book {
            width: 90%;
            min-width: 0;
            max-width: none;
            min-height: unset;
        }
        .cover {
            display: block;
            width: 90%;
            margin: 12px auto;
            height: auto;
        }
        .book img {
            width: 100%;
            height: auto;
            aspect-ratio: 8 / 13;
        }

        .book.reviews-mode {
            display: block;
            grid-column: 1 / -1;
            width: min(
                250px,
                calc(100% - 2rem)
            );
            max-width: 100%;
            min-width: 0; 
            margin: 0.75rem auto;
            padding: 0.6rem 0.8rem;
            border-radius: 8px;
            box-shadow: 0 1px 6px #0006;
            border: 1px solid #2a2f3726; 
            background: #1b1e24;
        }
        .book.reviews-mode .cover {
            width: 90%;
            max-width: 220px;
            height: auto;
            margin-left: auto;
            margin-right: auto;
        }
        .book.reviews-mode img {
            width: 100%;
            height: auto;
            aspect-ratio: 8 / 13;
        }
        .book.reviews-mode .info-panel {
            margin-top: 0.6rem;
            max-width: 100%;
            padding: 0 0.25rem;
        }
    }
</style>
