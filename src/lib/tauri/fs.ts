import * as fs from "@tauri-apps/plugin-fs";
import type { FsModule } from "@/types/fs";

export const fsModule = fs as unknown as FsModule;
