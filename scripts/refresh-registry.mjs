// Refresh registry.json refs + checksums for every node entry.
//
// Walks each unique repo in `repos`, clones it shallowly, walks
// each node's `subpath`, computes SHA-256 of every tracked file
// (per `git ls-files`), and writes the new hashes back into the
// node's `checksums` block. The `ref` is bumped to `git rev-parse
// HEAD` of the upstream `default_branch`.
//
// Run via the manual GitHub Action (workflow_dispatch). Output
// goes to stdout as a unified diff so the workflow can post the
// before/after as the PR body.
//
// No notifications, no automation beyond what the user explicitly
// triggers.

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const REGISTRY = path.resolve("registry.json");

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function sha256OfFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return createHash("sha256").update(buf).digest("hex");
}

function checksumSubpath(repoDir, subpath) {
  const list = sh("git ls-files", { cwd: path.join(repoDir, subpath) }).split("\n").filter(Boolean);
  const out = {};
  for (const rel of list) {
    out[rel] = sha256OfFile(path.join(repoDir, subpath, rel));
  }
  return out;
}

function updateRegistry() {
  const before = fs.readFileSync(REGISTRY, "utf-8");
  const reg = JSON.parse(before);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "brAIn-store-refresh-"));

  const repoToHead = {};
  for (const [name, meta] of Object.entries(reg.repos)) {
    const target = path.join(tmp, name);
    sh(`git clone --depth 1 --branch ${meta.default_branch ?? "main"} ${meta.clone} ${target}`);
    repoToHead[name] = sh("git rev-parse HEAD", { cwd: target });
    console.error(`[${name}] HEAD = ${repoToHead[name]}`);
  }

  for (const node of reg.nodes) {
    const repoDir = path.join(tmp, node.repo);
    if (!fs.existsSync(repoDir)) continue;
    const newRef = repoToHead[node.repo];
    const newChecksums = checksumSubpath(repoDir, node.subpath);
    if (node.ref !== newRef) {
      console.error(`[${node.name}] ref ${node.ref ?? "<none>"}  ->  ${newRef}`);
    }
    node.ref = newRef;
    node.checksums = newChecksums;
  }

  reg.updated_at = new Date().toISOString().slice(0, 10);
  const after = JSON.stringify(reg, null, 2) + "\n";
  fs.writeFileSync(REGISTRY, after);
  console.error(`\n${before === after ? "no changes" : "registry updated"}`);
}

updateRegistry();
