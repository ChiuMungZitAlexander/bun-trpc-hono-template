/**
 * @type {import("prettier").Config}
 */
const prettierConfig = {
  printWidth: 80,
  tabWidth: 2,
  trailingComma: 'all',
  singleQuote: true,
  semi: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '^@/lib/(.*)$',
    '^@/trpc/(.*)$',
    '^@/routes/(.*)$',
    '@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default prettierConfig;
