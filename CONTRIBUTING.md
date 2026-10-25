# Contributing to Hardware-Inference

Thank you for your interest in contributing to **Hardware-Inference (LLM Hardware Calculator)**! 🚀

We welcome contributions of all kinds: bug reports, new GPU/accelerator profiles, precision estimation adjustments, UI improvements, documentation, and feature proposals.

Please take a few moments to review this guide to make your contribution process as smooth and effective as possible.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features & Hardware Data](#suggesting-features--hardware-data)
  - [Improving Documentation](#improving-documentation)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Project Architecture & Structure](#project-architecture--structure)
- [Git Workflow & Commit Guidelines](#git-workflow--commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [License](#license)

---

## Code of Conduct

All contributors and community participants are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to [jhaabhijeet864@gmail.com](mailto:jhaabhijeet864@gmail.com).

---

## How Can I Contribute?

### Reporting Bugs

Before creating a new bug report, please check existing [Issues](https://github.com/issues) to avoid duplicates. When opening a new bug report, please include:
- A clear, descriptive title.
- Steps to reproduce the unexpected behavior.
- Expected behavior vs. actual behavior.
- Operating system, browser, and device specs.
- Screenshots or console error logs if applicable.

### Suggesting Features & Hardware Data

We are always looking to expand our hardware database (NVIDIA, AMD, Intel, Apple Silicon, Google TPU, Tenstorrent, etc.) and model presets.
- Use our **Hardware Request** issue template.
- Provide reputable sources (manufacturer spec sheets, whitepapers, or validated benchmarks).
- Specify memory capacity (GB), memory type (e.g., GDDR6, HBM3e), memory bus width, and peak memory bandwidth (GB/s).

### Improving Documentation

Found a typo or unclear explanation? Documentation improvements are warmly welcomed! You can submit a pull request directly for minor typo fixes and clarifications.

---

## Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**

### Installation

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/Hardware-Inference.git
   cd Hardware-Inference
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` (or the printed port) in your browser.

4. Run code quality checks:
   ```bash
   # Linting
   npm run lint

   # Type checking & build verification
   npm run build
   ```

---

## Project Architecture & Structure

```
Hardware-Inference/
├── .github/              # Issue/PR templates, CI workflows, Dependabot
├── src/                  # Application source code
│   ├── components/       # Reusable UI primitives and calculator views
│   ├── data/             # Hardware profiles, model presets, and benchmark tables
│   ├── hooks/            # Custom React hooks & state persistence
│   ├── lib/              # VRAM estimation math & calculation utilities
│   └── types/            # TypeScript type definitions
├── index.html            # Main HTML entrypoint
├── package.json          # Package manifest & scripts
├── tailwind.config.js    # Tailwind styling config
└── vite.config.ts        # Vite build tool configuration
```

---

## Git Workflow & Commit Guidelines

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standard. This ensures a clean, searchable history and automated changelog compatibility.

### Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Common Types:
- `feat`: A new feature (e.g., adding INT2 quantization calculations)
- `fix`: A bug fix (e.g., fixing KV cache math for GQA models)
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, whitespace (no code change)
- `refactor`: Refactoring production code without changing behavior
- `perf`: Code changes that improve performance
- `test`: Adding or correcting tests
- `chore`: Updating dependencies, build scripts, or repository configuration

### Examples:
```bash
git commit -m "feat(hardware): add NVIDIA B200 and H200 SXM specs"
git commit -m "fix(vram): correct KV cache calculation for sliding window attention"
git commit -m "docs(contributing): clarify hardware submission guidelines"
```

---

## Pull Request Process

1. **Create a topic branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Make your changes**: Write clean, readable code and keep commits focused and atomic.
3. **Verify locally**: Ensure both `npm run lint` and `npm run build` pass without warnings or errors.
4. **Push branch to your fork**:
   ```bash
   git push origin feat/my-new-feature
   ```
5. **Open a Pull Request**:
   - Provide a concise summary of the change.
   - Reference any relevant issues (e.g., `Closes #42`).
   - Fill out all checkboxes in the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
6. **Code Review**: A maintainer will review your changes and provide feedback or merge your contribution.

---

## License

By contributing to **Hardware-Inference**, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
