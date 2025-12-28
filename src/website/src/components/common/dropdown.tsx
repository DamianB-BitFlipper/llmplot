import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DropdownContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown")
  }
  return context
}

interface DropdownProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function Dropdown({ value, onValueChange, children }: DropdownProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </DropdownContext.Provider>
  )
}

interface DropdownTriggerProps {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, children, style }, ref) => {
    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          style={style}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="truncate text-left">{children}</span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
    )
  }
)
DropdownTrigger.displayName = "DropdownTrigger"

interface DropdownContentProps {
  className?: string
  children: React.ReactNode
  align?: "start" | "center" | "end"
}

function DropdownContent({ className, children, align = "start" }: DropdownContentProps) {
  return (
    <PopoverContent
      className={cn(
        "w-[var(--radix-popover-trigger-width)] min-w-[8rem] p-1",
        "max-h-[32rem] overflow-y-auto",
        className
      )}
      align={align}
      sideOffset={4}
    >
      <div role="listbox">{children}</div>
    </PopoverContent>
  )
}

interface DropdownItemProps {
  value: string
  children: React.ReactNode
  onSelect?: () => void
  keepOpen?: boolean
  className?: string
  style?: React.CSSProperties
}

function DropdownItem({
  value,
  children,
  onSelect,
  keepOpen = false,
  className,
  style,
}: DropdownItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = useDropdownContext()
  const isSelected = selectedValue === value

  const handleClick = () => {
    if (onSelect) {
      onSelect()
    } else {
      onValueChange?.(value)
    }
    if (!keepOpen) {
      setOpen(false)
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      style={style}
      onClick={handleClick}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
}
