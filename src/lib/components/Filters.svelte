<script lang="ts">
    import type { Writable } from "svelte/store";
    import type { FiltersState, ReviewFilter, SortDir, SortKey } from "$lib";

    export let filters: Writable<FiltersState>;
    export let shelfOptions: string[] = [];
    export let minYear: number;
    export let maxYear: number;
    export let minPages: number;
    export let maxPages: number;
    export let maxStars: number = 5;

    // Disable rating/review when the current shelf implies unread
    $: shelfLower = ($filters?.shelf || "").toLowerCase();
    $: metaDisabled =
        shelfLower === "to-read" || shelfLower === "currently-reading";
    // Block choosing unread shelves when filters imply read
    $: shelfBlockedForUnread =
        $filters.rating > 0 || $filters.review === "with";

    // Resets to 0 if you select the same value
    function setRating(r: number) {
        filters.update((s: FiltersState) => {
            const shelf = (s.shelf || "").toLowerCase();
            const disallow =
                shelf === "to-read" || shelf === "currently-reading";
            return { ...s, rating: disallow ? 0 : s.rating === r ? 0 : r };
        });
    }

    function setShelf(v: string) {
        const lower = (v || "").toLowerCase();
        const disallow = lower === "to-read" || lower === "currently-reading";
        filters.update((s: FiltersState) => ({
            ...s,
            shelf: v,
            // If the new shelf implies unread, clear rating/review
            rating: disallow ? 0 : s.rating,
            review: disallow ? ("all" as ReviewFilter) : s.review,
        }));
    }

    // Review filter: all | with | without
    function setReview(v: ReviewFilter) {
        filters.update((s: FiltersState) => {
            const shelf = (s.shelf || "").toLowerCase();
            const disallow =
                shelf === "to-read" || shelf === "currently-reading";
            return { ...s, review: disallow ? ("all" as ReviewFilter) : v };
        });
    }

    function setSortKey(v: SortKey) {
        filters.update((s: FiltersState) => ({ ...s, sortKey: v }));
    }

    function setSortDir(v: SortDir) {
        filters.update((s: FiltersState) => ({ ...s, sortDir: v }));
    }
</script>

<nav class="filters" aria-label="Book filters">
    <div class="filters__row">
        <div class="filters__group filters__search">
            <input
                class="filter-input"
                type="text"
                placeholder="Search title or author..."
                aria-label="Search by title or author"
                value={$filters.text}
                on:input={(e) =>
                    filters.update((s: FiltersState) => ({
                        ...s,
                        text: (e.currentTarget as HTMLInputElement).value,
                    }))}
            />
        </div>
        <div
            class="filters__group filters__rating"
            class:is-disabled={metaDisabled}
        >
            <span class="filter-label">Rating:</span>
            <span class="star-filter" role="group" aria-label="Rating filter">
                {#each Array(maxStars) as _, i}
                    <button
                        type="button"
                        class="star {i + 1 <= $filters.rating
                            ? 'selected'
                            : ''}"
                        disabled={metaDisabled}
                        aria-label={`Filter by ${i + 1} stars`}
                        aria-pressed={i + 1 === $filters.rating}
                        on:click={() => setRating(i + 1)}>&#9733;</button
                    >
                {/each}
            </span>
        </div>
        <div class="filters__group filters__sort">
            <span class="filter-label">Sort:</span>
            <div class="sort-controls">
                <label>
                    <span class="sr-only">Sort by</span>
                    <select
                        class="filter-select"
                        aria-label="Sort by"
                        value={$filters.sortKey}
                        on:change={(e) =>
                            setSortKey(
                                (e.currentTarget as HTMLSelectElement)
                                    .value as SortKey
                            )}
                    >
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                        <option value="rating">Rating</option>
                    </select>
                </label>
                <label>
                    <span class="sr-only">Sort order</span>
                    <select
                        class="filter-select"
                        aria-label="Sort order"
                        value={$filters.sortDir}
                        on:change={(e) =>
                            setSortDir(
                                (e.currentTarget as HTMLSelectElement)
                                    .value as SortDir
                            )}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>
            </div>
        </div>
    </div>

    <div class="filters__row">
        <div
            class="filters__group filters__shelves"
            class:is-disabled={shelfBlockedForUnread}
        >
            <span class="filter-label">Shelves:</span>
            <div class="shelves-select" aria-hidden="false">
                <select
                    class="filter-select"
                    aria-label="Select shelf"
                    value={$filters.shelf}
                    on:change={(e) =>
                        setShelf((e.currentTarget as HTMLSelectElement).value)}
                >
                    {#each shelfOptions as shelf}
                        <option
                            value={shelf}
                            disabled={shelfBlockedForUnread &&
                                ((shelf || "").toLowerCase() === "to-read" ||
                                    (shelf || "").toLowerCase() ===
                                        "currently-reading")}>{shelf}</option
                        >
                    {/each}
                </select>
            </div>
            <div class="shelves-scroll">
                {#each shelfOptions as shelf}
                    <button
                        class="filter-btn {$filters.shelf === shelf
                            ? 'active'
                            : ''}"
                        disabled={shelfBlockedForUnread &&
                            ((shelf || "").toLowerCase() === "to-read" ||
                                (shelf || "").toLowerCase() ===
                                    "currently-reading")}
                        on:click={() => setShelf(shelf)}>{shelf}</button
                    >
                {/each}
            </div>
        </div>
        <div
            class="filters__group filters__reviews"
            class:is-disabled={metaDisabled}
        >
            <span class="filter-label">Reviews:</span>
            <div class="reviews-select" aria-hidden="false">
                <select
                    class="filter-select"
                    aria-label="Select reviews filter"
                    value={metaDisabled ? "all" : $filters.review}
                    on:change={(e) =>
                        setReview(
                            (e.currentTarget as HTMLSelectElement)
                                .value as ReviewFilter
                        )}
                    disabled={metaDisabled}
                >
                    <option value="all">All</option>
                    <option value="with">With review</option>
                    <option value="without">Without review</option>
                </select>
            </div>
            <div class="filter-pills" role="group" aria-label="Reviews filter">
                <button
                    class="filter-btn {$filters.review === 'all'
                        ? 'active'
                        : ''}"
                    on:click={() => setReview("all")}>All</button
                >
                <button
                    class="filter-btn {$filters.review === 'with'
                        ? 'active'
                        : ''}"
                    disabled={metaDisabled}
                    on:click={() => setReview("with")}>With review</button
                >
                <button
                    class="filter-btn {$filters.review === 'without'
                        ? 'active'
                        : ''}"
                    disabled={metaDisabled}
                    on:click={() => setReview("without")}>Without review</button
                >
            </div>
        </div>
    </div>

    <div class="filters__row">
        <div class="filters__group filters__sliders">
            <label class="slider-block">
                <span class="filter-label">Year</span>
                <input
                    class="filter-slider"
                    type="range"
                    min={minYear}
                    max={maxYear}
                    step="1"
                    value={$filters.yearMin}
                    on:input={(e) =>
                        filters.update((s: FiltersState) => ({
                            ...s,
                            yearMin:
                                parseInt(
                                    (e.currentTarget as HTMLInputElement).value,
                                    10
                                ) || s.yearMin,
                        }))}
                    aria-valuemin={minYear}
                    aria-valuemax={maxYear}
                    aria-valuenow={$filters.yearMin}
                />
                <span class="filter-value" aria-live="polite"
                    >{$filters.yearMin}</span
                >
            </label>
            <label class="slider-block">
                <span class="filter-label">Pages</span>
                <input
                    class="filter-slider"
                    type="range"
                    min={minPages}
                    max={maxPages}
                    step="1"
                    value={$filters.pagesMin}
                    on:input={(e) =>
                        filters.update((s: FiltersState) => ({
                            ...s,
                            pagesMin:
                                parseInt(
                                    (e.currentTarget as HTMLInputElement).value,
                                    10
                                ) || s.pagesMin,
                        }))}
                    aria-valuemin={minPages}
                    aria-valuemax={maxPages}
                    aria-valuenow={$filters.pagesMin}
                />
                <span class="filter-value" aria-live="polite"
                    >{$filters.pagesMin}</span
                >
            </label>
        </div>
    </div>
</nav>
