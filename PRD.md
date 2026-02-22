# Planning Guide

A comprehensive web-based calculator for determining hardware requirements, memory usage, and training metrics for local LLM deployment and fine-tuning.

**Experience Qualities**: 
1. **Technical Precision** - Provides accurate, reliable calculations based on real-world LLM architecture specifications
2. **Educational Clarity** - Explains complex GPU/memory concepts in an accessible way with helpful context
3. **Professional Efficiency** - Enables quick decision-making for hardware purchases and model deployment planning

**Complexity Level**: Light Application (multiple features with basic state)
This is a calculator tool with multiple interconnected features (inference calculator, training calculator, quantization comparison) that maintains user inputs but doesn't require complex workflows or backend integration.

## Essential Features

### Inference Memory Calculator
- **Functionality**: Calculates VRAM/RAM requirements for running inference on a local LLM based on model parameters, precision, and context length
- **Purpose**: Helps users determine if their hardware can run a specific model
- **Trigger**: User selects or inputs model parameters (size, precision, context length)
- **Progression**: Select model size → Choose precision (FP32/FP16/INT8/INT4) → Set context length → View memory breakdown → See recommended GPUs
- **Success criteria**: Displays accurate memory requirements with breakdown (model weights, KV cache, overhead) and GPU recommendations

### Training/Fine-tuning Calculator
- **Functionality**: Estimates memory requirements for training or fine-tuning, including optimizer states, gradients, and batch size considerations
- **Purpose**: Helps users plan hardware for model training or LoRA fine-tuning
- **Trigger**: User switches to training mode and inputs training parameters
- **Progression**: Select training method (full fine-tune/LoRA/QLoRA) → Input batch size & gradient accumulation → Choose optimizer → View memory requirements → Compare training methods
- **Success criteria**: Shows total VRAM needed with detailed breakdown of components (weights, gradients, optimizer states, activations)

### Quantization Comparison Tool
- **Functionality**: Compares memory usage, performance impact, and quality trade-offs across different quantization methods
- **Purpose**: Helps users understand trade-offs between model size and quality
- **Trigger**: User selects a model to analyze quantization options
- **Progression**: Input base model → View precision options side-by-side → Compare memory savings → See quality impact estimates
- **Success criteria**: Clear visualization of memory savings and estimated quality retention for each quantization level

### Popular Models Presets
- **Functionality**: Quick-select buttons for popular models (Llama, Mistral, Gemma, Phi, etc.)
- **Purpose**: Saves time by auto-filling parameters for well-known models
- **Trigger**: User clicks a preset button
- **Progression**: Click preset → Parameters auto-populate → Adjust if needed → View calculations
- **Success criteria**: Accurate parameter counts for 10+ popular model families

### GPU Database & Recommendations
- **Functionality**: Matches calculated requirements with suitable GPU options
- **Purpose**: Provides actionable hardware recommendations
- **Trigger**: Automatic after calculations complete
- **Progression**: Calculate requirements → System suggests suitable GPUs → User views VRAM capacity and pricing tier
- **Success criteria**: Lists 3-5 GPU options sorted by suitability with VRAM capacity

## Edge Case Handling

- **Extreme Parameters**: Gracefully handle unrealistic inputs (e.g., 1 trillion parameters) with warnings or caps
- **Mobile/Small Screens**: Stack calculator sections vertically, use accordions for complex breakdowns
- **No JavaScript**: Core calculations require JS; show message if disabled
- **Invalid Inputs**: Real-time validation with helpful error messages (e.g., "Context length must be positive")
- **Zero/Negative Values**: Prevent submission and highlight fields requiring correction

## Design Direction

The design should evoke technical precision, professional credibility, and computational power. It should feel like a high-end engineering tool - clean, data-dense but organized, with subtle nods to GPU/hardware aesthetics through geometric patterns and tech-inspired colors. The interface should instill confidence through clarity and thoroughness.

## Color Selection

A dark-leaning technical palette with electric accent colors reminiscent of GPU backlighting and circuit boards.

- **Primary Color**: Deep slate blue `oklch(0.25 0.05 250)` - Communicates technical depth and computational focus
- **Secondary Colors**: 
  - Charcoal background `oklch(0.15 0.01 250)` - Professional, reduces eye strain for data-heavy interfaces
  - Mid-tone slate `oklch(0.35 0.03 250)` - Card backgrounds and secondary surfaces
- **Accent Color**: Electric cyan `oklch(0.75 0.15 195)` - High-tech feel, draws attention to calculations and CTAs
- **Foreground/Background Pairings**: 
  - Primary slate (oklch(0.25 0.05 250)): White text (oklch(0.98 0 0)) - Ratio 9.2:1 ✓
  - Charcoal background (oklch(0.15 0.01 250)): Light gray text (oklch(0.90 0.01 250)) - Ratio 11.8:1 ✓
  - Accent cyan (oklch(0.75 0.15 195)): Charcoal text (oklch(0.15 0.01 250)) - Ratio 8.4:1 ✓
  - Card background (oklch(0.35 0.03 250)): White text (oklch(0.98 0 0)) - Ratio 6.7:1 ✓

## Font Selection

Typefaces should balance technical precision with readability - monospace for numbers/specs, clean sans-serif for descriptions.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold / 32px / tight letter-spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk Semibold / 20px / normal letter-spacing
  - H3 (Calculator Labels): Space Grotesk Medium / 16px / normal letter-spacing
  - Body Text: Inter Regular / 14px / line-height 1.6
  - Numbers/Values: JetBrains Mono Medium / 16px / tabular-nums for alignment
  - Small Labels: Inter Medium / 12px / uppercase / tracking-wide

## Animations

Animations should feel computational and precise - quick, purposeful, with subtle emphasis on calculated results.

- **Number Transitions**: Use spring animations when calculated values update to create a "computing" feel
- **Card Reveals**: Subtle slide-up with fade for results panels (300ms ease-out)
- **Input Focus**: Smooth border glow with accent color (150ms)
- **Preset Selection**: Quick scale pulse (100ms) on click to confirm selection
- **Results Updates**: Gentle highlight flash in accent color when values recalculate (400ms fade)

## Component Selection

- **Components**: 
  - **Card**: Primary container for calculator sections with subtle border and darker background
  - **Tabs**: Switch between Inference/Training/Quantization modes
  - **Input**: Number inputs for parameters with clear labels and units
  - **Select**: Dropdown for precision, optimizer, and model presets
  - **Slider**: Interactive control for batch size and context length with real-time feedback
  - **Badge**: Display precision types (FP32, INT4) and GPU VRAM capacities
  - **Separator**: Divide calculation sections clearly
  - **Tooltip**: Provide explanations for technical terms
  - **Progress**: Visualize memory usage as percentage of GPU capacity
  - **Table**: Display GPU recommendations and memory breakdowns

- **Customizations**: 
  - Custom gradient borders on focused cards using Tailwind's border-image utilities
  - Monospace font override for all numeric displays
  - Custom grid pattern background using repeating-linear-gradient
  - Highlight effect on calculated results using subtle background pulse

- **States**: 
  - Inputs: Default has subtle border, focus gets cyan glow, filled shows checkmark icon
  - Preset buttons: Outlined default, filled on select, subtle scale on hover
  - Calculate button: Primary accent color, slight elevation on hover, press animation
  - Results: Fade in with stagger effect, highlight briefly on recalculation

- **Icon Selection**: 
  - Cpu: Represent model parameters and processing
  - GpuCard: Hardware recommendations
  - Lightning: Training speed/performance
  - Database: Memory/storage requirements
  - ArrowsClockwise: Recalculate/refresh
  - Info: Tooltips and help text
  - ChartBar: Memory breakdown visualizations

- **Spacing**: 
  - Page padding: p-6 (mobile) / p-8 (desktop)
  - Card padding: p-6
  - Section gaps: gap-8 for major sections, gap-4 for related inputs
  - Input groups: gap-2 for label-input pairs
  - Grid layouts: gap-4 for calculator grids

- **Mobile**: 
  - Stack all calculator inputs vertically on mobile
  - Tabs convert to full-width buttons
  - Tables become scrollable horizontally or convert to cards
  - Reduce padding to p-4 on cards
  - Single column layout for all sections below 768px
  - Sticky calculate button at bottom on mobile
