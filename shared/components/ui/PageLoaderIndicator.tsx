"use client"
import React from 'react'
import { Loader } from "lucide-react"
import { useLinkStatus } from 'next/link'

const PageLoaderIndicator = () => {
    const { pending } = useLinkStatus()
    return (
        <div>
            {pending && <Loader className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
    )
}

export default PageLoaderIndicator