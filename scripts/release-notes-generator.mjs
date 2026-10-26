#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to run git commands safely
function runGit(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL || (process.platform === 'win32' ? 'NUL' : '/dev/null'),
        GIT_CONFIG_NOSYSTEM: '1',
      },
    }).trim();
  } catch {
    // Retry with standard env if sandboxed/special config fails
    return execSync(command, { cwd: rootDir, encoding: 'utf-8' }).trim();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}
const isDryRun = args.includes('--dry-run');
const writeChangelog = args.includes('--write-changelog');
const updatePackage = args.includes('--update-package');
const bumpOverride = getArg('--bump');
const outputFile = getArg('--output');
const outputVersionFile = getArg('--output-version');

// Repository URL detection
let repoUrl = 'https://github.com/jhaabhijeet864/Hardware_Infernece_Engine_For_GPU';
try {
  const remote = runGit('git config --get remote.origin.url');
  if (remote) {
    repoUrl = remote
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
  }
} catch {
  // Use fallback
}

// Find latest tag
let latestTag = null;
try {
  const tags = runGit('git tag -l "v*" --sort=-v:refname')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length > 0) {
    latestTag = tags[0];
  }
} catch {
  latestTag = null;
}

// Determine git revision range
const isInitialRelease = !latestTag;

// Fetch commits
let rawCommits = '';
try {
  if (isInitialRelease) {
    rawCommits = runGit('git log --pretty=format:"%H%x1f%s%x1f%an%x1f%ad" --date=short');
  } else {
    rawCommits = runGit(`git log ${latestTag}..HEAD --pretty=format:"%H%x1f%s%x1f%an%x1f%ad" --date=short`);
  }
} catch (e) {
  console.error(`Failed to read git commits: ${e.message}`);
  process.exit(1);
}

const commitLines = rawCommits.split('\n').filter((line) => line.trim().length > 0);
const parsedCommits = commitLines.map((line) => {
  const parts = line.split('\x1f');
  const hash = parts[0] || '';
  const shortHash = hash.slice(0, 7);
  const subject = parts[1] || '';
  const author = parts[2] || '';
  const date = parts[3] || '';

  // Conventional commit parsing: type(scope)!: message
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  const isBreaking = subject.includes('BREAKING CHANGE') || (match && match[3] === '!');

  return {
    hash,
    shortHash,
    subject,
    type: match ? match[1].toLowerCase() : 'other',
    scope: match ? match[2] : null,
    message: match ? match[4] : subject,
    author,
    date,
    isBreaking,
  };
});

// Category definitions
const categories = {
  breaking: { title: '⚠️ Breaking Changes', items: [] },
  feat: { title: '🚀 Features & Architectural Enhancements', items: [] },
  fix: { title: '🐛 Bug Fixes & Stability', items: [] },
  perf: { title: '⚡ Performance Optimizations', items: [] },
  docs: { title: '📚 Documentation & Reference', items: [] },
  test: { title: '🧪 Testing & Verification', items: [] },
  maintenance: { title: '🔧 Tooling, CI/CD & Maintenance', items: [] },
  other: { title: '📋 Other Changes', items: [] },
};

let hasBreaking = false;
let hasFeat = false;

const contributors = new Set();

for (const commit of parsedCommits) {
  if (commit.author) {
    contributors.add(commit.author);
  }

  if (commit.isBreaking) {
    hasBreaking = true;
    categories.breaking.items.push(commit);
    continue;
  }

  switch (commit.type) {
    case 'feat':
      hasFeat = true;
      categories.feat.items.push(commit);
      break;
    case 'fix':
      categories.fix.items.push(commit);
      break;
    case 'perf':
      categories.perf.items.push(commit);
      break;
    case 'docs':
      categories.docs.items.push(commit);
      break;
    case 'test':
      categories.test.items.push(commit);
      break;
    case 'refactor':
    case 'chore':
    case 'ci':
    case 'build':
    case 'style':
      categories.maintenance.items.push(commit);
      break;
    default:
      categories.other.items.push(commit);
      break;
  }
}

// Determine next SemVer version
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const currentPkgVersion = pkg.version || '0.0.0';

let baseVersion = '0.0.0';
if (latestTag) {
  baseVersion = latestTag.replace(/^v/, '');
} else if (currentPkgVersion !== '0.0.0') {
  baseVersion = currentPkgVersion;
}

function parseSemver(v) {
  const parts = v.split('.').map((n) => parseInt(n, 10) || 0);
  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

let nextVersion = '0.1.0';

if (bumpOverride && bumpOverride !== 'auto') {
  if (bumpOverride === 'major') {
    const sem = parseSemver(baseVersion);
    nextVersion = `${sem.major + 1}.0.0`;
  } else if (bumpOverride === 'minor') {
    const sem = parseSemver(baseVersion);
    nextVersion = `${sem.major}.${sem.minor + 1}.0`;
  } else if (bumpOverride === 'patch') {
    const sem = parseSemver(baseVersion);
    nextVersion = `${sem.major}.${sem.minor}.${sem.patch + 1}`;
  } else {
    // Custom explicit version string (e.g. "0.2.0" or "v0.2.0")
    nextVersion = bumpOverride.replace(/^v/, '');
  }
} else if (isInitialRelease) {
  nextVersion = '0.1.0';
} else {
  const sem = parseSemver(baseVersion);
  if (hasBreaking) {
    if (sem.major === 0) {
      // In 0.x.y, breaking changes bump minor
      nextVersion = `0.${sem.minor + 1}.0`;
    } else {
      nextVersion = `${sem.major + 1}.0.0`;
    }
  } else if (hasFeat) {
    nextVersion = `${sem.major}.${sem.minor + 1}.0`;
  } else {
    nextVersion = `${sem.major}.${sem.minor}.${sem.patch + 1}`;
  }
}

const nextTag = `v${nextVersion}`;
const today = new Date().toISOString().split('T')[0];

// Build release notes markdown
let markdown = `## Hardware Inference Engine ${nextTag} (${today})\n\n`;

let totalCategorized = 0;
for (const [, cat] of Object.entries(categories)) {
  if (cat.items.length === 0) continue;
  totalCategorized += cat.items.length;
  markdown += `### ${cat.title}\n\n`;
  for (const item of cat.items) {
    const scopeStr = item.scope ? `**${item.scope}**: ` : '';
    markdown += `- ${scopeStr}${item.message} ([${item.shortHash}](${repoUrl}/commit/${item.hash})) - ${item.author}\n`;
  }
  markdown += '\n';
}

if (totalCategorized === 0) {
  markdown += `*Maintenance and operational updates.*\n\n`;
}

// Contributors section
if (contributors.size > 0) {
  markdown += `### 👥 Contributors\n\n`;
  for (const contrib of Array.from(contributors).sort()) {
    markdown += `- ${contrib}\n`;
  }
  markdown += '\n';
}

// Compare link
markdown += `---\n\n`;
if (latestTag) {
  markdown += `**Full Changelog**: [${latestTag}...${nextTag}](${repoUrl}/compare/${latestTag}...${nextTag})\n`;
} else {
  markdown += `**Initial Release Commits**: [${nextTag}](${repoUrl}/commits/${nextTag})\n`;
}

// Output summary
console.log('----------------------------------------------------');
console.log(`Current Base Tag:     ${latestTag || 'None (Initial Release)'}`);
console.log(`Computed Next Tag:    ${nextTag} (Version: ${nextVersion})`);
console.log(`Commits Analyzed:     ${parsedCommits.length}`);
console.log('----------------------------------------------------');
console.log(markdown);

// Write to output file if requested
if (outputFile) {
  const resolvedOut = path.resolve(rootDir, outputFile);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
  fs.writeFileSync(resolvedOut, markdown, 'utf-8');
  console.log(`✓ Release notes written to: ${outputFile}`);
}

// Write version to output file if requested
if (outputVersionFile) {
  const resolvedVerOut = path.resolve(rootDir, outputVersionFile);
  fs.mkdirSync(path.dirname(resolvedVerOut), { recursive: true });
  fs.writeFileSync(resolvedVerOut, nextVersion, 'utf-8');
  console.log(`✓ Version (${nextVersion}) written to: ${outputVersionFile}`);
}

// Update package.json and CHANGELOG.md if not dry-run
if (!isDryRun) {
  if (updatePackage) {
    pkg.version = nextVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✓ Updated package.json version to: ${nextVersion}`);
  }

  if (writeChangelog) {
    const changelogPath = path.join(rootDir, 'CHANGELOG.md');
    let changelogContent = '';
    if (fs.existsSync(changelogPath)) {
      changelogContent = fs.readFileSync(changelogPath, 'utf-8');
    }

    // Insert new version section after unreleased or at top of versions
    const unreleasedHeader = '## [Unreleased]';
    const newChangelogSection = `## [${nextVersion}] - ${today}\n\n` + markdown.replace(/^## .*\n\n/, '');

    if (changelogContent.includes(unreleasedHeader)) {
      changelogContent = changelogContent.replace(
        unreleasedHeader,
        `${unreleasedHeader}\n\n---\n\n${newChangelogSection}`
      );
    } else {
      changelogContent = `# Changelog\n\n${newChangelogSection}\n\n${changelogContent}`;
    }

    fs.writeFileSync(changelogPath, changelogContent, 'utf-8');
    console.log(`✓ Synchronized CHANGELOG.md with ${nextVersion}`);
  }
}
