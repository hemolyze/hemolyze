'use client';

import * as React from "react";
import {
  MoreHorizontal,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu as InnerSidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { NavLink } from "./ui/NavLink";
import { deleteReportAction } from "@/entities/report/api/actions";

// Type for report items (can be shared or redefined if needed)
interface SidebarReportItem {
  id: string;
  name: string;
  url: string;
  status: string;
}

// Props specifically for this client component
export interface NavDocumentsContentProps {
  title: string;
  items: SidebarReportItem[];
  action?: React.ReactNode;
}

// The actual Client Component
export function NavDocumentsContent({ title, items, action }: NavDocumentsContentProps) {
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (reportId: string, reportName: string) => {
    if (!reportId) {
      toast.error("Could not identify report to delete.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteReportAction(reportId);
        if (result.success) {
          toast.success(result.message || `Report "${reportName}" deleted.`);
          router.push('/new');
        } else {
          toast.error(result.error || `Failed to delete "${reportName}".`);
        }
      } catch (error) {
        console.error("Client-side error deleting report:", error);
        toast.error("An unexpected error occurred while deleting the report.");
      }
    });
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        {action}
      </div>
      {items.length > 0 ? (
        <InnerSidebarMenu className="flex flex-col gap-1 overflow-y-auto flex-1 pr-2">
          {items.map((item) => {
            console.log('item', item)
            const reportId = item.id;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild>
                  <NavLink href={item.url} prefetch={true} icon={<FileText className="h-4 w-4" />}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{item.name}</span>
                    </span>
                  </NavLink>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="data-[state=open]:bg-accent rounded-sm cursor-pointer"
                      disabled={isPending}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options for {item.name}</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-32 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                    sideOffset={5}
                  >
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          onSelect={(e) => e.preventDefault()}
                          disabled={isPending || !reportId}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            report &quot;<strong>{item.name}</strong>&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleDelete(reportId, item.name)}
                            disabled={isPending || !reportId}
                          >
                            {isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          })}
        </InnerSidebarMenu>
      ) : (
        <p className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
          No reports found.
        </p>
      )}
    </SidebarGroup>
  );
} 