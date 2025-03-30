import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            sourceType: "module",
            ecmaVersion: "latest"
        },
        plugins: { "@typescript-eslint": ts },
        rules: {
            ...ts.configs.recommended.rules, // TypeScript recommended rules
            "no-unused-vars": "off", // Disable default rule (TypeScript handles this)
            "@typescript-eslint/no-unused-vars": ["error"], // TypeScript's version
            "@typescript-eslint/explicit-function-return-type": "off", // Optional
            "@typescript-eslint/no-explicit-any": "warn", // Warn against `any`
            "@typescript-eslint/no-non-null-assertion": "warn", // Avoid `!` operator
        }
    },
];
