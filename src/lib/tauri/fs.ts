import * as fs from "@tauri-apps/plugin-fs";
import type { FsModule } from "@/types/explorer";

export const fsModule = fs as unknown as FsModule;
