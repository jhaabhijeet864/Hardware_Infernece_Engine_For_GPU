# Planning Guide

A specialized web application for calculating VRAM and memory requirements for running and training Large Language Models, with intelligent GPU recommendations.

**Experience Qualities**:
1. **Technical Precision** - Users should feel confident in the accuracy of memory calculations and hardware recommendations, with detailed breakdowns that educate as they inform
2. **Futuristic Sophistication** - The interface should evoke cutting-edge AI technology through bold purple/cyan colorways, glowing effects, and refined glassmorphic panels
3. **Effortless Clarity** - Complex hardware specifications should be instantly understandable through visual hierarchies, progress bars, and color-coded indicators

**Complexity Level**: Light Application (multiple features with basic state)
This is an interactive calculator tool with preset management, configuration options, and real-time computation. State management is straightforward with configuration inputs and calculation outputs.

## Essential Features

**Model Preset Selection**
- Functionality: Quick-select popular LLM architectures (Llama 3, Mistral, Gemma, Phi-3) with pre-configured parameters
- Purpose: Eliminate manual parameter lookup and provide instant starting points for common models
- Trigger: User clicks on a model preset card
- Progression: User views preset cards → Clicks desired model → Configuration auto-populates → Results update instantly
- Success criteria: Parameters correctly load for each preset; custom model option allows manual override

**VRAM Calculation Engine**
- Functionality: Real-time computation of memory requirements based on model parameters, precision, context length, and optimizations
- Purpose: Give developers accurate hardware requirements before deployment
- Trigger: Any change to configuration inputs (parameters, precision, context length, toggles)
- Progression: User adjusts input → Calculation runs → Results display with breakdown (weights, KV cache, overhead)
- Success criteria: Calculations match industry-standard formulas; breakdown shows component contributions; updates within 100ms

**Interactive Configuration**
- Functionality: Fine-tune calculation inputs including parameter count, precision format, context length slider, and optimization toggles
- Purpose: Accommodate various deployment scenarios and hardware optimization strategies
- Trigger: User modifies any input field or toggle
- Progression: User enters/selects value → Input validates → Calculation updates → Results refresh with animation
- Success criteria: All inputs constrained to valid ranges; context slider shows tick marks; toggles affect calculations appropriately

**GPU Recommendations**
- Functionality: Display ranked list of GPUs with compatibility indicators, utilization percentages, and visual progress bars
- Purpose: Guide hardware purchasing/rental decisions with clear fit indicators
- Trigger: Calculation completes with new VRAM requirement
- Progression: VRAM calculated → GPUs ranked by suitability → Best match highlighted → Insufficient GPUs flagged
- Success criteria: GPUs sorted by utilization efficiency; color-coding distinguishes optimal/viable/insufficient options; utilization bars accurately reflect capacity

**Multi-Mode Tabs**
- Functionality: Switch between Inference, Training, and Quantization calculation modes
- Purpose: Support different LLM deployment scenarios with mode-specific calculations
- Trigger: User clicks tab in navigation
- Progression: User clicks tab → Active state updates → Configuration panel adapts → Calculation formula adjusts
- Success criteria: Active tab visually distinct with glow effect; configurations persist per tab; formulas correct per mode

## Edge Case Handling

- **Oversized Context Windows**: Display warning when context length exceeds typical GPU memory capabilities, suggest quantization or optimization strategies
- **Invalid Parameter Combinations**: Validate that precision + parameters + context fit within physical hardware limits; show helpful error states
- **Extreme Parameter Values**: Constrain inputs to realistic ranges (0.1B-1000B parameters, 512-128k context); prevent calculation errors
- **Insufficient GPU Memory**: Clearly flag GPUs that cannot accommodate the model; suggest multi-GPU setups or quantization
- **Zero/Negative Inputs**: Prevent invalid numeric inputs; enforce minimum values; show validation feedback

## Design Direction

The design should evoke the feeling of professional AI infrastructure tooling—sleek, precise, and futuristic. Users should feel like they're working with cutting-edge technology through the bold purple-cyan gradient accents, glowing numerical displays, and sophisticated glassmorphic panels that suggest transparency and clarity in computation.

## Color Selection

A dark cyberpunk aesthetic with vibrant purple primary and cyan accent, creating high contrast against deep backgrounds for technical precision.

- **Primary Color**: oklch(0.59 0.24 305) - Vibrant purple (#b642f0) for active states, borders, and brand identity; communicates innovation and AI technology
- **Secondary Colors**: 
  - Background Dark: oklch(0.12 0.03 305) - Deep purple-black for main background
  - Surface Dark: oklch(0.16 0.04 305) - Card/panel backgrounds with slight lift
  - Surface Highlight: oklch(0.20 0.05 305) - Hover states and input fields
- **Accent Color**: oklch(0.73 0.14 195) - Cyan (#22d3ee) for result highlights, success states, and visual emphasis; provides energetic contrast
- **Foreground/Background Pairings**:
  - Background Dark (oklch(0.12 0.03 305)): White text (oklch(0.96 0 0)) - Ratio 13.2:1 ✓
  - Surface Dark (oklch(0.16 0.04 305)): Slate 200 (oklch(0.85 0.01 280)) - Ratio 9.8:1 ✓
  - Primary Purple (oklch(0.59 0.24 305)): White text (oklch(1.0 0 0)) - Ratio 5.1:1 ✓
  - Accent Cyan (oklch(0.73 0.14 195)): Background Dark (oklch(0.12 0.03 305)) - Ratio 8.4:1 ✓

## Font Selection

Typography should convey technical sophistication with a blend of geometric display fonts for headings and monospace for numerical precision.

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/20px/tight tracking - Modern geometric sans for brand presence
  - H2 (Section Headers): Space Grotesk Bold/18px/normal tracking - Consistent hierarchy
  - Body Text: Space Grotesk Regular/14px/relaxed leading - Clean readability
  - Numerical Data: JetBrains Mono Bold/14-60px/tabular nums - Technical precision for metrics
  - Labels: Space Grotesk Semibold/11px/wide tracking uppercase - Clear input labeling
  - Micro Text: JetBrains Mono Regular/10px - Technical metadata and badges

## Animations

Animations should reinforce computational feedback—subtle pulsing on calculation results, smooth number transitions for live updates, and glowing effects that suggest energy and processing power.

- Result value changes animate with spring physics (framer-motion) to feel responsive
- Tab switching includes smooth underline slide and background fade transitions
- GPU recommendation cards use staggered entrance animations (50ms delay each)
- Calculation result pulses with cyan glow on update to draw attention
- Slider thumb glows with box-shadow on interaction
- Toggle switches animate with smooth translate transform (0.2s ease)
- Preset cards scale subtly (1.05x) on hover with border glow intensification

## Component Selection

- **Components**: 
  - Tabs (navigation modes) - Shadcn Tabs with custom styling for active state glow and bottom border indicator
  - Card - Shadcn Card as base for all panels with glassmorphic backdrop-blur modifications
  - Slider - Shadcn Slider for context length with custom track/thumb styling to match purple theme
  - Switch - Shadcn Switch for optimization toggles (KV Cache, Flash Attention) with purple checked state
  - Select - Shadcn Select for precision dropdown with custom Material Symbols chevron icon
  - Input - Shadcn Input for parameter fields with monospace font and unit suffixes
  - Button - Shadcn Button for presets and actions with gradient backgrounds and glow effects
  - Avatar - Shadcn Avatar for user profile in header
  
- **Customizations**:
  - Glassmorphic panels: bg-[surface-dark]/70 backdrop-blur-md with border-primary/10
  - Gradient borders: Use wrapper div with gradient background and inner content card
  - Result display: Custom component with giant glowing numbers using text-shadow and drop-shadow
  - GPU cards: Custom component with progress bars, badges, and utilization metrics
  - Material Symbols: Use Phosphor Icons as alternative (Memory, Tune, ChartBar, Warning, etc.)
  
- **States**:
  - Buttons: Default (border-primary bg-primary/10), Hover (bg-primary/20 scale-105), Active (border-primary/50 with glow), Selected (gradient background with checkmark badge)
  - Inputs: Default (border-surface-highlight), Focus (border-primary ring-primary glow), Error (border-red-500/30), Disabled (opacity-50)
  - Toggles: Unchecked (bg-surface-highlight), Checked (bg-primary with shadow glow), Hover (brightness increase)
  
- **Icon Selection**: 
  - Header logo: Cpu (Phosphor) for memory/compute theme
  - Model preset cards: Letter badges with gradient backgrounds (no icons needed)
  - Configuration: SlidersHorizontal for tune, Code for model presets
  - GPUs: Video Card icon, Server for datacenter GPUs, Warning for insufficient
  - Nav tabs: GraphicsCard, Lightning, ChartBar icons
  
- **Spacing**: 
  - Section gaps: gap-6 (24px) between major sections
  - Card padding: p-6 (24px) for comfortable breathing room
  - Input groups: gap-4 (16px) for form field spacing
  - Inline elements: gap-2 (8px) for icon-text pairs
  - Tight groups: gap-1 (4px) for badges and chips
  
- **Mobile**: 
  - Header: Stack title and user profile vertically on small screens; collapse settings to icon-only buttons
  - Tabs: Grid 3 columns on mobile with icon+text stacked vertically; scroll horizontally if needed
  - Two-column layout: Stack to single column on <lg breakpoint
  - GPU cards: Maintain full width; increase touch targets to 44px minimum
  - Sliders: Expand to full width; show value badge prominently above slider
  - Number inputs: Full width on mobile with larger touch targets
