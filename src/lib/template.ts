import fs from "fs";
import path from "path";

export { templateScriptPaths } from "@/constants/templateAssets";

type TemplateMarkup = {
  body: string;
};

const TEMPLATE_FILE = path.join(process.cwd(), "src", "template.html");

let cachedTemplate: TemplateMarkup | null = null;

export function getTemplateMarkup(): TemplateMarkup {
  if (cachedTemplate) {
    return cachedTemplate;
  }

  if (!fs.existsSync(TEMPLATE_FILE)) {
    throw new Error(`Missing template file at ${TEMPLATE_FILE}`);
  }

  const rawHtml = fs.readFileSync(TEMPLATE_FILE, "utf-8");
  const withoutScripts = stripTemplateScripts(rawHtml);
  const body = extractBody(withoutScripts);
  const normalized = rewriteAssetPaths(body);
  cachedTemplate = { body: normalized };
  return cachedTemplate;
}

function extractBody(markup: string): string {
  const lower = markup.toLowerCase();
  const bodyStart = lower.indexOf("<body");
  if (bodyStart === -1) {
    return markup;
  }
  const openTagEnd = markup.indexOf(">", bodyStart);
  const closeTagIndex = lower.lastIndexOf("</body>");
  const bodySlice = markup.slice(openTagEnd + 1, closeTagIndex === -1 ? undefined : closeTagIndex);
  return bodySlice;
}

function rewriteAssetPaths(input: string): string {
  let output = input.replace(/\.\.\/assets\//g, "/template-assets/");
  output = output.replace(/(^|["'(=\s])assets\//g, (_match, prefix: string) => {
    return `${prefix}/template-page-assets/`;
  });
  return output;
}

function stripTemplateScripts(input: string): string {
  return input.replace(/<script[^>]*assets[^>]*><\/script>/gi, "");
}
