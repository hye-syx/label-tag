"use client"

import * as React from "react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

export function DialogContent({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative z-50 w-full max-w-lg bg-white p-6 shadow-lg rounded-lg ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col space-y-1.5 text-left ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  )
}

export function DialogFooter({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-row justify-end space-x-2 ${className}`}>
      {children}
    </div>
  )
}
