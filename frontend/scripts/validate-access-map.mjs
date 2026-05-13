import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const appDir = join(root, "app");
const accessMapPath = join(root, "lib", "appAccessMap.ts");
const permissionsPath = join(root, "lib", "permissions.ts");
const menuPath = join(root, "layout", "AppMenuEmpresa.tsx");
const dashboardPath = join(root, "app", "empresa", "page.tsx");

const errors = [];

const read = (path) => readFileSync(path, "utf8");

const unique = (values) => Array.from(new Set(values)).sort();

const extractMatches = (source, pattern, group = 1) => {
  const matches = [];
  for (const match of source.matchAll(pattern)) {
    matches.push(match[group]);
  }
  return matches;
};

const accessMapSource = read(accessMapPath);
const permissionsSource = read(permissionsPath);
const menuSource = read(menuPath);
const dashboardSource = read(dashboardPath);

const accessPrefixes = unique(
  extractMatches(accessMapSource, /prefix:\s*"([^"]+)"/g),
);
const legacyPrefixes = unique(
  accessMapSource.split("\n").flatMap((line, index, lines) => {
    if (!line.includes("legacy: true")) return [];

    for (let i = index; i >= 0; i -= 1) {
      const prefix = lines[i].match(/prefix:\s*"([^"]+)"/)?.[1];
      if (prefix) return [prefix];
    }

    return [];
  }),
);
const permissionLabels = new Set(
  extractMatches(permissionsSource, /"([a-z_]+(?:\.[a-z_]+)+)"\s*:/g),
);

const generateCrudPermissions = (prefix, approvable = false) => [
  `${prefix}.view`,
  `${prefix}.create`,
  `${prefix}.update`,
  `${prefix}.delete`,
  ...(approvable ? [`${prefix}.approve`] : []),
];

const permissionCodesInAccessMap = unique([
  ...extractMatches(accessMapSource, /gate\("([^"]+)"/g),
  ...extractMatches(accessMapSource, /anyGate\(\s*\[([\s\S]*?)\]/g).flatMap(
    (source) => extractMatches(source, /"([^"]+)"/g),
  ),
  ...extractMatches(accessMapSource, /manage\("([^"]+)",\s*"([^"]+)"/g, 1),
  ...extractMatches(accessMapSource, /manage\("([^"]+)",\s*"([^"]+)"/g, 2),
  ...extractMatches(accessMapSource, /crud\("([^"]+)"/g).flatMap((prefix) =>
    generateCrudPermissions(prefix),
  ),
  ...extractMatches(accessMapSource, /approvableCrud\("([^"]+)"/g).flatMap(
    (prefix) => generateCrudPermissions(prefix, true),
  ),
]);

const missingLabels = permissionCodesInAccessMap.filter(
  (permission) => !permissionLabels.has(permission),
);
if (missingLabels.length > 0) {
  errors.push(
    `Faltan etiquetas en frontend/lib/permissions.ts: ${missingLabels.join(", ")}`,
  );
}

const toRoutePath = (pageFile) => {
  const appRelative = relative(appDir, pageFile).split(sep).join("/");
  const segments = appRelative
    .replace(/\/page\.tsx$/, "")
    .split("/")
    .filter((segment) => segment && !segment.startsWith("("));

  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
};

const listPageFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listPageFiles(fullPath));
    } else if (entry === "page.tsx") {
      files.push(fullPath);
    }
  }
  return files;
};

const pageRoutes = new Set(listPageFiles(appDir).map(toRoutePath));

const toStaticRoute = (route) => route.replace(/\/\[[^\]]+\]/g, "");
const hasPageRoute = (route) => {
  if (pageRoutes.has(route)) return true;
  const staticRoute = toStaticRoute(route);
  return staticRoute !== route && pageRoutes.has(staticRoute);
};

const hasAccessRule = (route) =>
  accessPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));

const visibleEmpresaLinks = unique([
  ...extractMatches(menuSource, /to:\s*"([^"]+)"/g),
  ...extractMatches(dashboardSource, /to:\s*"([^"]+)"/g),
]).filter((route) => route.startsWith("/empresa"));

const missingPages = visibleEmpresaLinks.filter((route) => !hasPageRoute(route));
if (missingPages.length > 0) {
  errors.push(`Links visibles sin page.tsx: ${missingPages.join(", ")}`);
}

const missingAccessRules = visibleEmpresaLinks.filter((route) => !hasAccessRule(route));
if (missingAccessRules.length > 0) {
  errors.push(`Links visibles sin regla de acceso: ${missingAccessRules.join(", ")}`);
}

const legacyVisibleLinks = visibleEmpresaLinks.filter((route) =>
  legacyPrefixes.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`),
  ),
);
if (legacyVisibleLinks.length > 0) {
  errors.push(
    `Links visibles apuntan a rutas legacy: ${legacyVisibleLinks.join(", ")}`,
  );
}

const requiredCanonicalPurchaseRoutes = [
  "/empresa/compras",
  "/empresa/compras/proveedores",
  "/empresa/compras/ordenes-compra",
  "/empresa/compras/reportes/rendimiento-proveedores",
];
const missingCanonicalPurchases = requiredCanonicalPurchaseRoutes.filter(
  (route) => !visibleEmpresaLinks.includes(route) || !hasPageRoute(route),
);
if (missingCanonicalPurchases.length > 0) {
  errors.push(
    `Faltan rutas canónicas visibles de Compras: ${missingCanonicalPurchases.join(", ")}`,
  );
}

const empresaPageRoutes = Array.from(pageRoutes).filter((route) =>
  route.startsWith("/empresa"),
);
const unguardedEmpresaPages = empresaPageRoutes.filter(
  (route) => !hasAccessRule(route),
);
if (unguardedEmpresaPages.length > 0) {
  errors.push(
    `Páginas /empresa sin regla de acceso: ${unguardedEmpresaPages.join(", ")}`,
  );
}

for (const route of requiredCanonicalPurchaseRoutes) {
  const pageFile = join(
    appDir,
    ...route.split("/").filter(Boolean),
    "page.tsx",
  );
  if (!existsSync(pageFile)) {
    errors.push(`No existe page.tsx para ${route}`);
  }
}

if (errors.length > 0) {
  console.error("Validación de access map falló:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Access map OK: ${accessPrefixes.length} reglas, ${visibleEmpresaLinks.length} links visibles y ${empresaPageRoutes.length} rutas /empresa validadas.`,
);
