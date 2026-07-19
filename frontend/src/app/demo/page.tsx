"use client";

import { Component as DemoComponent } from "@/components/demo";

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-panel p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-foreground">
          Radix UI Dialog Demo
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          This page demonstrates the integration of the custom shadcn-style Radix dialog component. Click the button below to open the modal.
        </p>
        <div className="flex justify-center">
          <DemoComponent />
        </div>
      </div>
    </div>
  );
}
