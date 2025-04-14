"use client";

import Link, { useLinkStatus } from 'next/link'
import React, { ReactNode } from 'react'
import { SidebarMenuButton } from './sidebar'
import { Loader } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
const NavLink = ({ icon, href, prefetch, children }: { icon: ReactNode, href: string, prefetch: boolean, children: ReactNode }) => {
    return (
        <Link href={href} prefetch={prefetch}>
            <CustomLink icon={icon} href={href}>
                {children}
            </CustomLink>
        </Link>
    )
}

const CustomLink = ({ children, icon, href }: { children: ReactNode, icon: ReactNode, href: string }) => {
    const { pending } = useLinkStatus()
    const pathname = usePathname()

    const isActive = pathname.includes(href)
    return (
        <SidebarMenuButton asChild>
            <div className={cn("flex items-center gap-2", isActive && "bg-accent", {
                'opacity-50 hover:bg-accent': pending
            })}>
                {pending ? <Loader className="h-4 w-4 animate-spin text-muted-foreground" /> : icon}
                {children}
            </div>
        </SidebarMenuButton>
    )
}

export { NavLink }