# LLM Hardware Calculator - Product Requirements Document

A professional-grade calculator for estimating VRAM and RAM requirements for running and training Large Language Models with hardware recommendations.

**Experience Qualities**:
1. **Technical Confidence** - Users should feel empowered with accurate, actionable information presented clearly
2. **Visual Sophistication** - A refined, modern interface that stands out from typical calculator tools with bold design choices
3. **Seamless Adaptability** - Effortless transitions between desktop and mobile with no compromise in functionality

**Complexity Level**: Light Application (multiple features with basic state)
This is a multi-view calculator with three distinct modes (Inference, Training, Quantization), persistent user preferences, and dynamic calculations with visual feedback. The complexity fits a professional tool that requires no backend infrastructure but provides substantial value through client-side computation and intelligent presentation.

## Essential Features

### Feature 1: Inference Memory Calculator
- **Functionality**: Calculate VRAM requirements for running LLM inference based on model size, precision, and context length
- **Purpose**: Help users determine if they can run a specific model on their hardware before downloading/purchasing
- **Trigger**: User selects "Inference" tab or loads the app (default view)
- **Progression**: Select model preset or enter custom parameters → Adjust precision and context length → View memory breakdown → Review GPU recommendations
- **Success criteria**: Memory calculations update in real-time with smooth animations, GPU recommendations show utilization percentage, results persist across sessions

### Feature 2: Training Memory Calculator
- **Functionality**: Calculate VRAM requirements for training/fine-tuning with configurable batch size, optimizer, and training method (Full/LoRA/QLoRA)
- **Purpose**: Enable users to plan training infrastructure and optimize hyperparameters for available hardware
- **Trigger**: User selects "Training" tab
- **Progression**: Choose training method (Full/LoRA/QLoRA) → Select model and precision → Configure batch size and gradient accumulation → View comprehensive memory breakdown → Review GPU recommendations
- **Success criteria**: Training method selection clearly explains memory implications, calculations account for optimizer states and activations, recommendations warn when VRAM is insufficient

### Feature 3: Quantization Comparison
- **Functionality**: Side-by-side comparison of memory usage, quality retention, and speed across FP32/FP16/INT8/INT4 quantization
- **Purpose**: Help users make informed decisions about quantization trade-offs for their use case
- **Trigger**: User selects "Quantization" tab
- **Progression**: Select model → View comparative cards for each quantization level → Analyze memory savings vs quality retention → Read quantization guide
- **Success criteria**: Visual progress bars clearly show trade-offs, comparative metrics update instantly, educational guidance helps users choose appropriate quantization

### Feature 4: Persistent User Preferences
- **Functionality**: Automatically save and restore user's last used settings across all calculators
- **Purpose**: Provide a seamless experience for users who repeatedly check similar configurations
- **Trigger**: User modifies any parameter
- **Progression**: User changes parameter → System saves to KV store → User closes and reopens app → Settings restore automatically
- **Success criteria**: All parameters (model size, precision, batch size, etc.) persist, restoration is instant with no loading flicker

### Feature 5: Mobile-First Responsive Design
- **Functionality**: Fully functional and aesthetically pleasing interface on screens from 320px to 4K displays
- **Purpose**: Make the tool accessible to users on any device without compromising usability
- **Trigger**: User accesses app on any device
- **Progression**: App loads → Layout adapts to viewport → Touch targets are appropriately sized → Text remains readable → Features remain fully accessible
- **Success criteria**: All calculators work on mobile, cards stack gracefully, form inputs are easy to tap, sliders function with touch, tabs are thumb-friendly

## Edge Case Handling

- **Extreme Model Sizes**: When users enter unrealistic values (>1000B or <0.1B parameters), display warning message but still calculate to maintain exploration freedom
- **Insufficient VRAM**: When no consumer GPUs can handle the configuration, show clear warning with suggestions (reduce batch size, use quantization, try LoRA/QLoRA)
- **Rapid Parameter Changes**: Debounce calculations to prevent excessive re-renders and animations when users rapidly adjust sliders
- **Empty/Invalid Inputs**: Validate numeric inputs and default to reasonable values (7B for model size, fp16 for precision) when invalid
- **Mobile Orientation Changes**: Preserve state and scroll position when user rotates device between portrait and landscape

## Design Direction

The design should evoke **technical mastery and precision** - like a tool built by engineers for engineers, but with artistic refinement. Think of high-end dev tools like Vercel's dashboard or Linear's interface: dark, sophisticated, with pops of vibrant accent colors. The interface should feel like a specialized instrument - trustworthy, precise, and beautiful. Subtle gradients, soft glows on interactive elements, and confident typography should create a sense of premium quality.

## Color Selection

The design uses a **deep purple and cyan tech aesthetic** with sophisticated neutrals and electric accents.

- **Primary Color**: `oklch(0.60 0.25 280)` - Deep vibrant purple, communicates innovation and technical sophistication, used for primary actions and key metrics
- **Secondary Colors**: 
  - Background: `oklch(0.10 0.02 280)` - Almost black with subtle purple tint, creates depth
  - Surface/Card: `oklch(0.14 0.03 280)` - Elevated dark surface with purple undertone
- **Accent Color**: `oklch(0.70 0.18 195)` - Electric cyan, demands attention for calculations results and interactive states, creates tech-forward vibe
- **Foreground/Background Pairings**: 
  - Primary (Deep Purple #8B5CF6): White text (#FFFFFF) - Ratio 5.2:1 ✓
  - Accent (Electric Cyan #3DD4D9): Dark surface (#1A1625) - Ratio 8.9:1 ✓
  - Card (Dark Purple #232035): Light gray text (#E5E5E5) - Ratio 11.4:1 ✓
  - Background (Near Black #181420): Off-white text (#F5F5F5) - Ratio 15.8:1 ✓

## Font Selection

Typography should feel **technical yet refined** - monospace for precision, sans-serif for elegance. The combination conveys both engineering rigor and modern design sensibility.

- **Primary Font**: Space Grotesk - Geometric sans-serif with technical character but approachable warmth
- **Secondary Font**: JetBrains Mono - For all numeric displays, calculations, and data values to emphasize precision
- **Accent Font**: Bricolage Grotesque - For hero headings to add distinctive character

**Typographic Hierarchy**:
- H1 (Page Title): Bricolage Grotesque Bold/36px/tight tracking (-0.02em)
- H2 (Section Titles): Space Grotesk Bold/24px/normal tracking
- H3 (Card Titles): Space Grotesk Semibold/18px/normal tracking  
- Body Text: Space Grotesk Regular/16px/line-height 1.6
- Numeric Values: JetBrains Mono Medium/varies/tabular-nums for alignment
- Labels: Space Grotesk Medium/14px/slight spacing (0.01em)
- Captions: Space Grotesk Regular/13px/muted color

## Animations

Animations should feel **physics-based and purposeful** - never gratuitous. Use subtle spring animations for state changes, smooth easing for value updates, and gentle glows for focus states. Key moments: (1) Results cards slide in with staggered timing when calculations update, (2) Tab transitions with smooth fade and slight vertical motion, (3) GPU recommendation cards pulse subtly when first appearing, (4) Progress bars fill with smooth elastic easing, (5) Hover states on buttons show soft glow expansion.

## Component Selection

- **Components**: 
  - Tabs (shadcn) - For switching between Inference/Training/Quantization modes, styled with accent gradient on active state
  - Card (shadcn) - For all major content sections, with border-accent glow on result cards
  - Input (shadcn) - For numeric parameter entry, with focus ring in accent color
  - Slider (shadcn) - For context length and gradient accumulation, styled with accent thumb and track
  - Select (shadcn) - For precision and optimizer selection, with custom dropdown styling
  - Badge (shadcn) - For GPU tiers and recommended tags, using outline variant with accent border
  - Progress (shadcn) - For memory utilization visualization, with gradient fills
  - Tooltip (shadcn) - For parameter explanations, dark background with light text
  - Separator (shadcn) - For visual hierarchy in result breakdowns
  
- **Customizations**: 
  - Custom preset button component with selected state showing accent gradient background and subtle shadow
  - Enhanced result cards with animated entry and soft backdrop blur effect
  - GPU recommendation cards with hover state showing additional details
  - Custom slider marks for common values with labels

- **States**: 
  - Buttons: Default (subtle border), Hover (accent border glow), Active (accent background with scale), Disabled (50% opacity)
  - Inputs: Default (muted border), Focus (accent ring with glow), Error (red ring), Filled (slightly brighter background)
  - Cards: Default (subtle border), Results (accent border with glow), Warning (destructive border)

- **Icon Selection**: 
  - Phosphor Icons (duotone weight) throughout for consistency
  - GraphicsCard icon for Inference tab and GPU sections
  - Lightning icon for Training tab
  - ChartBar icon for Quantization tab
  - Database icon for memory requirement results
  - Info icon for tooltips (regular weight, muted color)
  - Cpu icon for processor-related elements

- **Spacing**: 
  - Page padding: 8 (2rem on desktop), 4 (1rem on mobile)
  - Card gap: 6 (1.5rem)
  - Form element gap: 4 (1rem)
  - Section gap within cards: 6 (1.5rem)
  - Label to input: 2 (0.5rem)
  - Inline element gap: 2-3 (0.5-0.75rem)

- **Mobile**:
  - Stack all grid layouts to single column below 768px
  - Tabs use full width with icons above text on mobile
  - Preset buttons arrange in scrollable horizontal row on small screens with snap points
  - Form inputs expand to full width
  - GPU recommendation cards remain full width with padding adjustment
  - Sliders get larger touch targets (min 44px height)
  - Footer text reduces to 12px
  - Reduce heading sizes by 20-30% on mobile
  - Card padding reduces from 6 to 4 on mobile

## Production System Design Architecture

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                         Client Tier                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React + Vite │  │ State (KV)   │  │ Calculations │      │
│  │  Components  │◄─┤  Management  │◄─┤    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Spark Runtime Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  KV Storage  │  │  LLM API     │  │  User Info   │      │
│  │   (persist)  │  │  (optional)  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

**1. Calculation Engine (`/lib/llm-calculations.ts`)**
- Pure functions for all memory calculations (no side effects)
- Comprehensive type definitions for parameters and results
- Unit-testable calculation logic
- Extensible for future model architectures (MoE, MQA, GQA)

**2. State Management**
- Use `useKV` hook for persistent user preferences
- Separate KV keys for each calculator's settings:
  - `inference-params` - Last used inference configuration
  - `training-params` - Last used training configuration  
  - `quantization-model` - Last selected model for comparison
  - `user-favorites` - Saved model configurations (future)
- React state for ephemeral UI (loading, animations, transient values)

**3. Component Architecture**
```
App.tsx (orchestrator)
├── Header (branding, navigation)
├── TabNavigation (mode switcher)
├── InferenceCalculator (container)
│   ├── ModelPresets (selection)
│   ├── ParameterForm (inputs)
│   └── ResultsDisplay (breakdown + GPUs)
├── TrainingCalculator (container)
│   ├── TrainingMethodSelector
│   ├── ConfigurationForm
│   └── TrainingResults
├── QuantizationComparison (container)
│   ├── ModelSelector
│   └── ComparisonGrid
└── Footer (disclaimers, attribution)
```

**4. Performance Optimizations**
- Memoize calculation results with `useMemo` to prevent redundant computation
- Debounce slider inputs to reduce calculation frequency during rapid changes
- Lazy load heavy components (charts, if added) with `React.lazy`
- Use `React.memo` for pure presentational components (preset buttons, result cards)
- Virtual scrolling for long GPU lists (if expanded to 50+ options)

**5. Data Validation & Error Handling**
- Zod schemas for all parameter types
- Graceful fallbacks for invalid calculations
- Error boundary around each calculator to prevent full app crashes
- User-friendly error messages ("This configuration requires..." not "Error: NaN")

**6. Accessibility**
- Semantic HTML throughout (`<main>`, `<section>`, `<article>`)
- ARIA labels on all interactive elements
- Keyboard navigation for tabs (arrow keys), sliders (arrow keys), presets
- Focus management when switching tabs
- Color contrast meets WCAG AA standards
- Screen reader announcements for calculation updates

**7. Analytics & Monitoring (Future)**
- Track calculator usage patterns (which modes are popular)
- Monitor calculation parameters to improve presets
- Error tracking with Sentry integration
- Performance monitoring with Web Vitals

**8. Future Enhancements**
- **Export/Share**: Generate shareable URLs with encoded parameters
- **Saved Configurations**: Allow users to save and name specific setups
- **Comparison Mode**: Side-by-side comparison of two configurations
- **Cost Estimation**: Add GPU rental costs from cloud providers
- **Multi-GPU Calculator**: Estimate for tensor parallel setups
- **Advanced Models**: Support for MoE routing calculations, GQA attention
- **Historical Data**: Track and visualize user's calculation history
- **Community Presets**: Share configurations with other users
- **API Mode**: Expose calculations as REST API for integration

### Deployment Strategy

**Development Environment**
- Vite dev server with HMR for rapid iteration
- Type checking with TypeScript strict mode
- Linting with ESLint
- Format with Prettier

**Production Build**
- Vite production build with tree-shaking
- Asset optimization (image compression, code splitting)
- Service worker for offline capability (future)
- CDN distribution for static assets

**Testing Strategy**
- Unit tests for calculation functions (vitest)
- Component tests for user interactions (Testing Library)
- E2E tests for critical flows (Playwright)
- Visual regression tests (Chromatic/Percy)

**Monitoring & Maintenance**
- Error tracking and reporting
- Performance monitoring
- Usage analytics
- Regular updates to model presets and GPU database

### Security Considerations
- All calculations client-side (no sensitive data transmission)
- Input sanitization for numeric values
- No external API calls required (except optional LLM features)
- CSP headers to prevent XSS
- Dependency vulnerability scanning

### Scalability Considerations
- Stateless client app scales horizontally
- KV storage handles user preferences efficiently
- No database bottlenecks (client-side calculations)
- Can handle GPU database growth to 100+ options
- Model preset expansion supported
