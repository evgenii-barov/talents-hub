import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const sourceRoots = ["app", "components"];
const catalogRoot = path.join("components", "i18n", "catalogs", "zh-hans");
const staticMessages = new Map();
const translatedMessages = new Set();
const errors = [];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filePath);
    return /\.(ts|tsx)$/.test(entry.name) ? [filePath] : [];
  });
}
function propertyName(property) {
  if (!ts.isPropertyAssignment(property)) return undefined;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    return property.name.text;
  return undefined;
}

function location(sourceFile, node) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return `${sourceFile.fileName}:${line + 1}`;
}

for (const filePath of sourceFiles(catalogRoot)) {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name))
      translatedMessages.add(node.name.text);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

for (const filePath of sourceRoots.flatMap(sourceFiles)) {
  if (filePath.startsWith(catalogRoot)) continue;
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === "tr" || node.expression.text === "localize")
    ) {
      const [argument] = node.arguments;
      if (!argument) return;

      if (
        node.expression.text === "tr" &&
        (ts.isStringLiteral(argument) ||
          ts.isNoSubstitutionTemplateLiteral(argument))
      ) {
        staticMessages.set(argument.text, location(sourceFile, node));
      } else if (ts.isObjectLiteralExpression(argument)) {
        const names = new Set(argument.properties.map(propertyName));
        if (!names.has("zh-Hans"))
          errors.push(`${location(sourceFile, node)} has no zh-Hans value`);
      } else if (node.expression.text === "tr") {
        errors.push(
          `${location(sourceFile, node)} uses a dynamic tr() value without a locale object`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

for (const [message, messageLocation] of staticMessages) {
  if (!translatedMessages.has(message))
    errors.push(`${messageLocation} has no Chinese catalog entry: ${message}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Chinese localization coverage is complete: ${staticMessages.size} static messages.`,
  );
}
