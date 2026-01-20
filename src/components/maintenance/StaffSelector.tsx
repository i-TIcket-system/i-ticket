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
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  allowedRoles?: string[] // If specified, only show these roles
  showUnassigned?: boolean
}

export function StaffSelector({
  staff,
  value,
  onValueChange,
  placeholder = "Select staff member",
  allowedRoles,
  showUnassigned = true,
}: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Filter staff by allowed roles if specified
  const filteredStaff = React.useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return staff
    }
    return staff.filter((member) => allowedRoles.includes(member.staffRole))
  }, [staff, allowedRoles])

  // Find selected staff member
  const selectedStaff = filteredStaff.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedStaff ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{selectedStaff.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedStaff.staffRole}
              </Badge>
            </div>
          ) : value === "unassigned" ? (
            <span className="text-muted-foreground">Unassigned</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, role, or ID..." />
          <CommandList>
            <CommandEmpty>No staff member found.</CommandEmpty>
            <CommandGroup>
              {showUnassigned && (
                <CommandItem
                  value="unassigned"
                  onSelect={() => {
                    onValueChange("unassigned")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "unassigned" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">Unassigned</span>
                </CommandItem>
              )}
              {filteredStaff.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.name} ${member.staffRole} ${member.id} ${member.email || ""}`}
                  onSelect={() => {
                    onValueChange(member.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{member.name}</span>
                      {member.email && (
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {member.staffRole}
                    </Badge>
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
