import { useState } from 'react'
import { Cpu, Gear, Question } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DocumentationModal } from './DocumentationModal'
import { OEMBrandingModal } from './OEMBrandingModal'
import { DEFAULT_OEM_BRANDING, OEMBrandingConfig } from '@/lib/engine/branding'
import { toast } from 'sonner'

export function Header() {
  const [isDocOpen, setIsDocOpen] = useState(false)
  const [isBrandingOpen, setIsBrandingOpen] = useState(false)
  const [branding, setBranding] = useState<OEMBrandingConfig>(DEFAULT_OEM_BRANDING)

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-6 py-4 z-50">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-gradient-to-br from-primary to-purple-900 rounded-lg flex items-center justify-center glow-primary">
            <Cpu size={24} weight="duotone" className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold leading-tight tracking-tight">
              Hardware Inference &amp; Qualification Engine
            </h1>
            <p className="text-muted-foreground text-xs font-mono">Local AI Workload Validation v2.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBrandingOpen(true)}
            title="OEM Partner Branding &amp; Delivery Settings"
            className="rounded-lg hover:bg-surface-highlight text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Gear size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDocOpen(true)}
            title="Open Scientific &amp; Formula Guide"
            className="rounded-lg hover:bg-surface-highlight text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Question size={20} />
          </Button>
          
          <div className="h-8 w-[1px] bg-border mx-2" />
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{branding.partnerName}</div>
              <div className="text-xs text-primary">{branding.certifierTitle}</div>
            </div>
            <Avatar className="size-9 border border-primary/30">
              <AvatarImage src="https://github.com/github.png" alt="User Avatar" />
              <AvatarFallback className="bg-surface-highlight text-white">HW</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <DocumentationModal isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />
      <OEMBrandingModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        branding={branding}
        onSave={(updated) => {
          setBranding(updated)
          toast.success('Updated delivery partner branding!')
        }}
      />
    </>
  )
}
