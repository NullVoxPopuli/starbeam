const { Linter, ESLint } = require("eslint");
const Rules = require("./rules.js");

/** @type {ESLint.ConfigData} */
exports.config = {
  parser: "@typescript-eslint/parser",
  settings: {
    "import/resolver": {
      typescript: {},
    },
    "import/ignore": ["\\.js\\?script"],
  },
  plugins: [
    "import",
    "unused-imports",
    "simple-import-sort",
    "prettier",
    "@typescript-eslint",
    "json",
  ],
};

exports.extends = [
  "eslint:recommended",
  "prettier",
  "plugin:prettier/recommended",
  "plugin:@typescript-eslint/recommended",
  "plugin:@typescript-eslint/recommended-requiring-type-checking",
  "plugin:json/recommended",
];

const TYPED_RULES = Rules.build((rules) =>
  rules
    .disable({
      untyped: [
        "no-fallthrough",
        "default-param-last",
        "no-dupe-class-members",
        "no-constant-condition",
      ],
      typed: ["no-invalid-void-type", "no-unused-vars", "no-dynamic-delete"],
      both: ["init-declarations", "no-undef"],
    })
    .replace([
      "default-param-last",
      "no-dupe-class-members",
      "no-invalid-this",
      "no-loop-func",
    ])
    .replace("dot-notation", {
      allowIndexSignaturePropertyAccess: true,
    })
    .typed([
      "explicit-module-boundary-types",
      "no-floating-promises",
      "prefer-readonly",
      "consistent-type-exports",
      "consistent-indexed-object-style",
      "consistent-generic-constructors",
      "method-signature-style",
      "no-confusing-void-expression",
      "no-redundant-type-constituents",
      "no-unnecessary-qualifier",
      "no-useless-empty-export",
      "prefer-enum-initializers",
      "prefer-regexp-exec",
      "promise-function-async",
    ])
    .typed("require-array-sort-compare", {
      ignoreStringArrays: true,
    })
    .typed("explicit-function-return-type", {
      allowExpressions: true,
      allowHigherOrderFunctions: true,
    })
    .typed("explicit-member-accessibility", {
      accessibility: "no-public",
    })
    .typed("no-restricted-imports", {
      paths: [
        {
          name: "@starbeam/core",
          message: "Please use @starbeam/universal instead of @starbeam/core.",
        },
      ],
    })
    .typed("no-extraneous-class", {
      allowEmpty: true,
    })
    .typed("consistent-type-imports", {
      disallowTypeAnnotations: false,
    })
    .typed("parameter-properties", {
      allow: ["readonly"],
    })
    .typed("no-type-alias", [
      "warn",
      {
        allowAliases: "always",
        allowCallbacks: "always",
        allowConditionalTypes: "always",
        allowConstructors: "always",
        allowLiterals: "in-unions-and-intersections",
        allowMappedTypes: "always",
        allowTupleTypes: "always",
        allowGenerics: "always",
      },
    ])
);

/** @type {Linter.RulesRecord} */
exports.rules = {
  ...TYPED_RULES,
  "unused-imports/no-unused-imports": "error",
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
  "unused-imports/no-unused-vars": [
    "warn",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
    },
  ],
};
