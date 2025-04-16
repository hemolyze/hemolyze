// This file is now purely a Server Component
// 'use client'; // <-- REMOVE this directive

import * as React from "react"
import { getReportsForSidebar } from "@/entities/report/api/queries"
import { NavDocumentsContent } from "./nav-documents-content"

// Define the type for the expected report item structure
// interface SidebarReportItem {
//   name: string
//   url: string
// }

// Props for the outer async Server component
interface NavDocumentsProps {
  title: string
  action?: React.ReactNode
  className?: string
}

// Outer Async Server Component fetches data and renders the Client Component
export async function NavDocuments({
  title,
}: NavDocumentsProps) {
  // Call the imported fetch function
  const items = await getReportsForSidebar()

  // Render the Client Component, passing fetched data as props
  return (
    <NavDocumentsContent title={title} items={items} />
  )
}
