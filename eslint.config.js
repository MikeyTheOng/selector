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
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
            },
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
                    capture: ["folder", "fileName"],
                    pattern: ["src/app/**/*", "src/App.tsx"],
                },
                {
                    mode: "full",
                    type: "test-utils",
                    pattern: ["src/test/**/*"],
                },
                {
                    mode: "full",
                    type: "neverImport",
                    capture: ["fileName"],
                    pattern: ["src/*"],
                },
            ],
        },
        rules: {
            "boundaries/no-unknown": ["error"],
            "boundaries/no-unknown-files": ["error"],
            "boundaries/element-types": [
                "error",
                {
                    default: "disallow",
                    rules: [
                        {
                            from: ["shared"],
                            allow: ["shared", "test-utils"],
                        },
                        {
                            from: ["feature"],
                            allow: [
                                "shared",
                                "test-utils",
                                ["feature", { featureName: "${from.featureName}" }],
                            ],
                        },
                        {
                            from: [["app", { folder: "__tests__" }]],
                            allow: ["shared", "feature", "app", "test-utils"],
                        },
                        {
                            from: ["app"],
                            allow: ["shared", "feature", "app"],
                        },
                        {
                            from: ["neverImport"],
                            allow: ["shared", "feature", "app", ["neverImport", { fileName: "*.css" }]],
                        },
                        {
                            from: ["test-utils"],
                            allow: ["shared", "feature", "app", "test-utils"],
                        }
                    ],
                },
            ],
        },
    },
    // --- OVERRIDE: Relax rules for UI Components ---
    {
        files: ["src/components/ui/**/*.{ts,tsx}", "src/components/kibo-ui/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": "off",
        },
    },
];