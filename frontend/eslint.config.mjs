import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // bỏ qua thư mục/file nếu muốn
  { ignores: ["node_modules/**", "dist/**", "build/**", ".next/**"] },

  // giữ nguyên các preset của Next + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // thêm 1 khối cấu hình để tắt cảnh báo
  {
    rules: {
      // tắt “any”, “unused”, và rule bắt <img>
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
