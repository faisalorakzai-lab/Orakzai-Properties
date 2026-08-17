import fs from "node:fs";

const path = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
const catalog = {
  "@replit/vite-plugin-cartographer": "^0.5.21",
  "@replit/vite-plugin-dev-banner": "^0.1.1",
  "@replit/vite-plugin-runtime-error-modal": "^0.0.6",
  "@tailwindcss/vite": "^4.1.14",
  "@tanstack/react-query": "^5.90.21",
  "@types/node": "^25.3.3",
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0",
  "@vitejs/plugin-react": "^5.0.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.545.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "tailwind-merge": "^3.3.1",
  "tailwindcss": "^4.1.14",
  "vite": "^7.3.2",
  "wouter": "^3.3.5",
  "zod": "^3.25.76",
};
for (const section of ["dependencies", "devDependencies"]) {
  for (const [name, value] of Object.entries(pkg[section] ?? {})) {
    if (value === "catalog:" && catalog[name]) pkg[section][name] = catalog[name];
    if (value === "workspace:*") pkg[section][name] = "file:./vendor/api-client-react";
  }
}
fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("Prepared npm-compatible Vercel manifest.");
