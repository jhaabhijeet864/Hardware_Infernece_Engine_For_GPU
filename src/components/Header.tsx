import { Cpu, Gear, Question } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-6 py-4 z-50">
      <div className="flex items-center gap-4">
        <div className="size-10 bg-gradient-to-br from-primary to-purple-900 rounded-lg flex items-center justify-center glow-primary">
          <Cpu size={24} weight="duotone" className="text-white" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold leading-tight tracking-tight">
            LLM Hardware Calculator
          </h1>
          <p className="text-muted-foreground text-xs font-mono">VRAM Estimation Tool v2.0</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg hover:bg-surface-highlight text-muted-foreground hover:text-foreground transition-colors"
        >
          <Gear size={20} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg hover:bg-surface-highlight text-muted-foreground hover:text-foreground transition-colors"
        >
          <Question size={20} />
        </Button>
        
        <div className="h-8 w-[1px] bg-border mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white">DevUser</div>
            <div className="text-xs text-primary">Pro Plan</div>
          </div>
          <Avatar className="size-9 border border-primary/30">
            <AvatarImage src="https://github.com/github.png" alt="User Avatar" />
            <AvatarFallback className="bg-surface-highlight text-white">DU</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
