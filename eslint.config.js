import js from "@eslint/js";
import tseslint from "typescript-eslint";
import projectStructure from "eslint-plugin-project-structure";
import boundaries from "eslint-plugin-boundaries";
import globals from "globals";

export default [
    {
        ignores: ["dist", "src-tauri/target", "node_modules"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "project-structure": projectStructure,
            boundaries,
        },
        settings: {
            "boundaries/include": ["src/**/*"],
            "boundaries/elements": [
                {
                    mode: "full",
                    type: "shared",
                    pattern: [
                        "src/components/**/*",
                        "src/data/**/*",
                        "src/hooks/**/*",
                        "src/lib/**/*",
                        "src/providers/**/*",
                        "src/types/**/*",
                        "src/store/**/*"
                    ],
                },
                {
                    mode: "full",
                    type: "feature",
                    capture: ["featureName"],
                    pattern: ["src/features/*/**/*"],
                },
                {
                    mode: "full",
                    type: "app",
                    capture: ["_", "fileName"],
                    pattern: ["src/app/**/*"],
                },
                {
                    mode: "full",
                    type: "neverImport",
                    pattern: ["src/*", "src/tasks/**/*"],
                },
            ],
        },
        rules: {
            // TODO: Configure project-structure rules in the future
            // "project-structure/file-structure": ["error", ...],

            // Boundaries Rules
            "boundaries/no-unknown": ["error"],
            "boundaries/no-unknown-files": ["error"],
            "boundaries/element-types": [
                "error",
                {
                    default: "disallow",
                    rules: [
                        {
                            from: ["shared"],
                            allow: ["shared"],
                        },
                        {
                            from: ["feature"],
                            allow: [
                                "shared",
                                ["feature", { featureName: "${from.featureName}" }],
                            ],
                        },
                        {
                            from: ["app"],
                            allow: ["shared", "feature", ["app", { fileName: "*.css" }]],
                        },
                        {
                            from: ["app", "neverImport"],
                            allow: ["shared", "feature"],
                        },
                    ],
                },
            ],
        },
    },
];