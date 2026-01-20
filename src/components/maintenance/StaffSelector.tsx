"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface StaffMember {
  id: string
  name: string
  staffRole: string
  email?: string
}

interface StaffSelectorProps {
  staff: StaffMember[]
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
  placeholder?: string
  allowedRoles?: string[] // If specified, only show these roles
  showUnassigned?: boolean
  multiple?: boolean // Enable multi-select mode
}

export function StaffSelector({
  staff,
  value,
  onValueChange,
  placeholder = "Select staff member",
  allowedRoles,
  showUnassigned = true,
  multiple = false,
}: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Filter staff by allowed roles if specified
  const filteredStaff = React.useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return staff
    }
    return staff.filter((member) => allowedRoles.includes(member.staffRole))
  }, [staff, allowedRoles])

  // Normalize value to array for easier handling
  const selectedIds = React.useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  // Find selected staff members
  const selectedStaff = React.useMemo(() => {
    return filteredStaff.filter((member) => selectedIds.includes(member.id))
  }, [filteredStaff, selectedIds])

  // Check if a member is selected
  const isSelected = (id: string) => selectedIds.includes(id)

  // Handle selection/deselection
  const handleSelect = (id: string) => {
    if (multiple) {
      const newSelection = isSelected(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
      onValueChange(newSelection)
    } else {
      // Single select: if already selected, deselect (empty string)
      onValueChange(isSelected(id) ? "" : id)
      setOpen(false)
    }
  }

  // Handle unassigned selection
  const handleUnassignedSelect = () => {
    if (multiple) {
      const newSelection = isSelected("unassigned")
        ? selectedIds.filter((s) => s !== "unassigned")
        : [...selectedIds, "unassigned"]
      onValueChange(newSelection)
    } else {
      onValueChange(isSelected("unassigned") ? "" : "unassigned")
      setOpen(false)
    }
  }

  // Remove a specific staff member (for multi-select chips)
  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      onValueChange(selectedIds.filter((s) => s !== id))
    } else {
      onValueChange("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[44px] px-3 py-2.5 hover:bg-teal-50/50 hover:border-teal-300 transition-all duration-200"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {selectedStaff.length > 0 ? (
              multiple ? (
                // Multi-select: Show chips
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {selectedIds.includes("unassigned") && (
                    <Badge
                      variant="secondary"
                      className="pl-2 pr-1 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Unassigned
                      <button
                        type="button"
                        onClick={(e) => handleRemove("unassigned", e)}
                        className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedStaff.map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 text-xs font-medium bg-teal-100 hover:bg-teal-200 text-teal-700 transition-colors"
                    >
                      {member.name}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(member.id, e)}
                        className="ml-1 rounded-full hover:bg-teal-300 p-0.5"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                // Single select: Show one staff member with clear button
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 ring-1 ring-teal-200">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-foreground truncate leading-tight">
                        {selectedStaff[0].name}
                      </span>
                      <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {selectedStaff[0].staffRole.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(selectedStaff[0].id, e)}
                    className="ml-2 rounded-full hover:bg-slate-200 p-1 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </>
              )
            ) : isSelected("unassigned") ? (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Unassigned</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove("unassigned", e)}
                  className="ml-auto rounded-full hover:bg-slate-200 p-1 transition-colors"
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-muted-foreground">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-3 h-4 w-4 shrink-0 text-muted-foreground/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 shadow-lg border-slate-200" align="start" sideOffset={8}>
        <Command className="rounded-lg">
          <div className="border-b bg-slate-50/50 px-3 py-2.5">
            <CommandInput
              placeholder="Search by name, role, or ID..."
              className="h-9"
            />
          </div>
          <CommandList className="max-h-[320px] overflow-y-auto p-2">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No staff member found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
              </div>
            </CommandEmpty>
            <CommandGroup className="p-0">
              {showUnassigned && (
                <CommandItem
                  value="unassigned"
                  onSelect={handleUnassignedSelect}
                  className="rounded-md px-3 py-3 mb-1.5 data-[selected=true]:bg-slate-100 cursor-pointer transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 shrink-0 text-teal-600",
                      isSelected("unassigned") ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="ml-3 text-sm font-semibold text-slate-700">Unassigned</span>
                </CommandItem>
              )}
              {filteredStaff.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.name} ${member.staffRole} ${member.id} ${member.email || ""}`}
                  onSelect={() => handleSelect(member.id)}
                  className="rounded-md px-3 py-3 mb-1.5 data-[selected=true]:bg-teal-50/70 cursor-pointer transition-all duration-150 hover:bg-teal-50/50"
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 shrink-0 text-teal-600",
                      isSelected(member.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 ring-1 ring-teal-200">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-sm text-slate-900 leading-tight">
                          {member.name}
                        </span>
                        {member.email && (
                          <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                            {member.email}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 border border-teal-200/50">
                          {member.staffRole.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
