<div align="center">
  
# 🚀 LLM Hardware Calculator 🧠💻

**Your ultimate VRAM estimator & GPU matchmaker for LLM inference, training, and quantization.**

[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](#)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)

Say goodbye to unexpected Out-Of-Memory (OOM) errors! 💥 A modern, lightning-fast web application that helps ML engineers and developers quickly estimate **GPU VRAM requirements** for Large Language Models and identify the perfect hardware to run (or train) them.

</div>

---

## ✨ Key Features

### 🧠 1. Inference Mode
Get straight to generation. Find out exactly what it takes to serve your model.
*   🎯 **Model Presets:** Fast starting points for popular models (Llama, Mistral, etc.).
*   🎛️ **Configurable Inputs:** Tweak parameter count (B), precision (FP16, INT8), context length, and optimizations.
*   📊 **Granular Breakdown:** See exactly where your VRAM goes (Weights + KV Cache + Overhead).
*   🏆 **GPU Matchmaker:** Get a ranked list of GPUs that fit your setup.

### 🏋️‍♂️ 2. Training Mode
Plan your next fine-tuning job without the guesswork.
*   ⚙️ **Approach Selection:** Full Fine-Tune, LoRA, or QLoRA.
*   🧪 **Deep Configuration:** Set optimizer choice, batch sizes, and gradient accumulation.
*   📈 **Memory Anatomy:** Detailed breakdown including weights, gradients, optimizer states, activations, and overhead.
*   🏆 **Hardware Recommendations:** Ranked by fitness for your specific training workload.

### 🗜️ 3. Quantization Mode
Weighing speed vs. quality? Compare them side-by-side.
*   ⚖️ **Format Showdown:** Compare FP32, FP16, INT8, and INT4 instantly.
*   💡 **Practical Guidance:** Actionable advice on the tradeoffs between memory footprint, inference speed, and model quality.

### 📤 4. Export & Sharing
Flex your setup or share it with your team.
*   📄 **Export to PDF:** Generates a beautiful, print-ready specs sheet.
*   🔗 **Shareable Links:** Your entire configuration is encoded in the URL. Copy, paste, and share!

---

## 🛠️ Tech Stack

We built this with a modern, snappy, and beautiful stack:

*   ⚛️ **React 19 + TypeScript:** Rock-solid UI and type safety.
*   ⚡ **Vite:** Blazing fast builds and HMR.
*   🎨 **Tailwind CSS v4:** Next-gen utility styling with custom CSS variables.
*   🧩 **Radix UI & shadcn-style:** Accessible, unstyled primitives turned beautiful.
*   ✨ **Framer Motion:** Buttery-smooth micro-interactions and layout transitions.
*   🍞 **Sonner:** The best toast notifications in the game.
*   💾 **GitHub Spark KV:** (`@github/spark/hooks`) Seamless persistence for all your UI state.

---

## 🚀 Getting Started

Ready to run this locally? Let's get you set up in seconds.

### 📋 Requirements
*   **Node.js** (latest LTS recommended)
*   **npm** (We respect the `package-lock.json`!)

### 💻 Installation & Commands

```bash
# 1. Clone & Install dependencies
npm install

# 2. Fire up the dev server 🔥
npm run dev

# 3. Build for production 🏗️
npm run build

# 4. Preview the production build 👀
npm run preview

# 5. Keep it clean ✨
npm run lint
```

---

## 📂 Repository Structure

```text
.
├── 📄 PRD.md                  # Product & design requirements (The Blueprint)
├── 🌐 index.html              # App entry point
├── 📦 package.json            # Scripts + dependencies
├── ⚙️ vite.config.ts          # Vite config (Spark + Tailwind + aliases)
├── 🎨 tailwind.config.js      # Tailwind config
├── 📁 src/
│   ├── ⚛️ App.tsx             # App shell + routing between modes
│   ├── 🚀 main.tsx            # React entry
│   ├── 💅 main.css            # Tailwind entry + base styling
│   ├── 🎨 index.css           # Theme tokens + custom utilities/effects
│   ├── 🧩 components/         # Calculators, panels, export buttons
│   ├── 🧱 components/ui/      # Shared Radix-based primitives
│   └── 🧠 lib/                # Core logic: VRAM math, types, export utils
└── ...
```

---

## 💾 State Persistence

Nobody likes losing their inputs. The app uses **GitHub Spark KV** to remember your selected settings (like your active tab and config values) between sessions.  
*Peek at `useKV(...)` in `src/App.tsx` to see the magic happen!*

---

## 🧮 The Calculation Model (How it works)

We focus on practical, real-world sizing estimates by modeling the heavy hitters of VRAM:

*   **Weights:** `Parameter Count × Bytes-per-parameter` (precision-dependent).
*   **KV Cache:** Scales dynamically with your context length and runtime assumptions.
*   **Training Multipliers:** Gradients, optimizer states (Adam vs. 8-bit), activations, and buffer overhead.

> ⚠️ **Disclaimer:** Results are estimates based on standard assumptions. Actual VRAM usage varies with framework (PyTorch/JAX), runtime (vLLM/TGI), kernels (FlashAttention), sequence packing, and offloading. 
> 
> *Want to dive deep? Check out the logic in `src/lib/`!*

---

## 🎨 Design Philosophy

This isn't just a spreadsheet; it's **AI Infrastructure Tooling**. 
Expect a dark, high-contrast, futuristic **purple & cyan** aesthetic, strong monospace typography for numeric clarity, and subtle Framer Motion animations to make calculations feel alive. 

*(Read the full design direction in [`PRD.md`](./PRD.md))*

---

## 🤝 Contributing

We love contributions! Want to make the math better? Add more GPUs? Let's do it. 

**Areas we're looking for help:**
*   🧮 Refining VRAM formulas and edge-case assumptions.
*   🖥️ Expanding the GPU dataset.
*   ♿ Accessibility (ARIA, keyboard navigation, contrast).
*   ⚡ Performance tuning.

### 🛤️ Suggested Workflow
1. Fork it 🍴
2. Branch it (`feat/mind-blowing-feature` or `fix/annoying-bug`) 🌿
3. Test it locally 🧪
4. PR it! (Please include screenshots for UI tweaks and before/after metrics for math changes) 🚀

---

## 🗺️ Roadmap

Want to help us reach "Industry Standard" status? Here's what's next:
- [ ] 🤖 **CI/CD:** Add GitHub Actions for linting and building.
- [ ] 🧹 **Formatting:** Introduce Prettier and strict linting rules.
- [ ] 🧪 **Testing:** Write robust unit tests for the calculator engine.
- [ ] 🌍 **Deployment:** Add a live demo link and hosting guide.

---

<div align="center">

### 🔒 Security & 📄 License
Please report security issues responsibly via [`SECURITY.md`](./SECURITY.md).  
This project is licensed under the terms in [`LICENSE`](./LICENSE).

**Built with ❤️ for the Open Source AI Community.**

</div>
