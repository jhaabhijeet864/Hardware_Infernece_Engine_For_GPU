import { Code, Check } from '@phosphor-icons/react'
import { MODEL_PRESETS } from '@/lib/constants'
import type { ModelPreset } from '@/lib/types'

interface ModelPresetSelectorProps {
  selectedId: string
  onSelect: (preset: ModelPreset) => void
}

export function ModelPresetSelector({ selectedId, onSelect }: ModelPresetSelectorProps) {
  return (
    <section className="glass-panel p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code size={20} weight="duotone" className="text-primary" />
          Select Model Preset
        </h2>
        <button className="text-xs text-primary hover:text-white transition-colors underline">
          Custom Model
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODEL_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedId
          
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className={`relative group flex flex-col gap-2 p-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/10 hover:bg-primary/20'
                  : 'border-border bg-card hover:border-muted-foreground/50'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 size-4 bg-primary rounded-full flex items-center justify-center">
                  <Check size={10} weight="bold" className="text-white" />
                </div>
              )}
              
              <div className={`size-8 rounded-lg bg-gradient-to-br ${preset.gradient} flex items-center justify-center shadow-lg ${!isSelected && 'group-hover:scale-110'} transition-transform`}>
                <span className="font-bold text-xs text-white">{preset.shortName}</span>
              </div>
              
              <div>
                <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`}>
                  {preset.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {preset.parameters}B Params
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
