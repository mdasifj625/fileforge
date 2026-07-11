import Dexie, { type Table } from "dexie";

export interface WorkspaceFile {
  id?: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

export interface HistoryState {
  id?: string;
  fileId: string;
  tool: string; // e.g., 'crop', 'brightness', 'remove-background'
  params: Record<string, unknown>; // Settings used for the tool
  blob?: Blob; // Optional: Cached resulting blob to speed up redo
  createdAt: number;
}

export class FileForgeDatabase extends Dexie {
  files!: Table<WorkspaceFile>;
  history!: Table<HistoryState>;

  constructor() {
    super("FileForgeDB");

    // Define database schema
    // Note: We only index fields we intend to query. Blobs are not indexed.
    this.version(1).stores({
      files: "id, createdAt", // Primary key and indexed props
      history: "id, fileId, createdAt",
    });
  }
}

export const db = new FileForgeDatabase();
