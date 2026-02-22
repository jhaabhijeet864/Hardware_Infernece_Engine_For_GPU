import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilePdf, Link, Export, Check } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { ExportData } from "@/lib/export-utils"
import { generatePDF, generateShareableLink, copyToClipboard } from "@/lib/export-utils"

interface ExportButtonProps {
  data: ExportData
  disabled?: boolean
}

export function ExportButton({ data, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handlePDFExport = async () => {
    setIsExporting(true)
    try {
      await generatePDF(data)
      toast.success("PDF export opened in new window")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareableLink = async () => {
    try {
      const link = generateShareableLink(data)
      await copyToClipboard(link)
      setLinkCopied(true)
      toast.success("Shareable link copied to clipboard!")
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link to clipboard")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isExporting}
          className="gap-2"
        >
          <Export size={18} weight="duotone" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handlePDFExport} disabled={isExporting}>
          <FilePdf size={18} weight="duotone" className="mr-2" />
          Save as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareableLink}>
          {linkCopied ? (
            <>
              <Check size={18} weight="duotone" className="mr-2 text-green-500" />
              Link Copied!
            </>
          ) : (
            <>
              <Link size={18} weight="duotone" className="mr-2" />
              Copy Shareable Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
