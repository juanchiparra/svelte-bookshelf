import type { PageServerLoad } from "./$types";
import { parse } from "csv-parse/sync";

// Imports and converts the CSV into objects
export const load: PageServerLoad = async () => {
    const csvMods = import.meta.glob("/src/lib/data/books.csv", {
        query: "?raw",
        import: "default",
        eager: true,
    }) as Record<string, string>;

    if (!Object.keys(csvMods).length) {
        throw new Error("Missing src/lib/data/books.csv");
    }

    const raw = Object.values(csvMods)[0] as string;
    let booksData: any[] = [];
    try {
        // Parser handles malformed CSV
        booksData = parse(raw, {
            columns: (header: string[]) => {
                const seen = new Map<string, number>();
                return header.map((h) => {
                    const key = (h || "").trim();
                    const count = (seen.get(key) || 0) + 1;
                    seen.set(key, count);
                    return count === 1 ? key : `${key}__${count}`;
                });
            },
            skip_empty_lines: true,
            relax_quotes: true,
            relax_column_count: true,
            bom: true,
            trim: true,
        });
    } catch (e) {
        console.error("Failed to parse books.csv:", e);
        booksData = [];
    }
    return { booksData };
};
