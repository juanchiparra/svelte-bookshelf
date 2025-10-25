// Centralized app types: book data and filters state

// Sorting keys and direction
export type SortKey = "title" | "author" | "rating";
export type SortDir = "asc" | "desc";
export type ReviewFilter = "all" | "with" | "without";

// Typed representation of a normalized book for the user interface
export type BookItem = {
    bookId: string | number;
    title: string;
    author: string;
    myRating: number;
    numberOfPages: number;
    yearPublished: number;
    dateRead?: string | null;
    originalPublicationYear: number;
    userCover: string;
    cover: string;
    read: boolean;
    exclusiveShelf: string;
    bookshelves: string[];
    ISBN: string;
    myReview: string;
    searchHaystack: string;
};

// Filters panel state
export type FiltersState = {
    text: string;
    shelf: string;
    rating: number;
    yearMin: number;
    pagesMin: number;
    review: ReviewFilter;
    sortKey: SortKey;
    sortDir: SortDir;
};
