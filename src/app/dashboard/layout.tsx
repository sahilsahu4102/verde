'use client';

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MenuProvider, useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LayoutDashboard, Settings, LogOut, Leaf, Loader2, Bell, Search, CreditCard, ShoppingBag, Star, LifeBuoy } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MenuProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </MenuProvider>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, signOut } = useAuth();
  const { plan, isLoading: subLoading } = useSubscription();
  const { searchQuery, setSearchQuery } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);



  if (isLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email || 'User';
  const fullName = user.user_metadata?.full_name || userEmail.split('@')[0];
  const cafeName = user.user_metadata?.cafe_name || `${fullName}'s Café`;
  const initials = (user.user_metadata?.full_name?.substring(0, 2) || userEmail.substring(0, 2)).toUpperCase();

  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Order Management",
      href: "/dashboard/sprout",
      icon: <ShoppingBag className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Reviews",
      href: "/dashboard/reviews",
      icon: <Star className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Subscription",
      href: "/dashboard/subscription",
      icon: <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-background text-foreground w-full overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-neutral-200 dark:border-neutral-700 bg-background dark:bg-neutral-900">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {sidebarOpen ? (
              <Link
                href="/dashboard"
                className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
              >
                <Logo className="h-12 w-12 flex-shrink-0" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-primary whitespace-pre text-lg tracking-wider"
                >
                  VERDE
                </motion.span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
              >
                <Logo className="h-12 w-12 flex-shrink-0" />
              </Link>
            )}

            {/* Nav Links */}
            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Bottom: Support + User + Logout */}
          <div className="flex flex-col gap-2">
            <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />
            <SidebarLink
              link={{
                label: "verdee.online@gmail.com",
                href: "mailto:verdee.online@gmail.com",
                icon: <LifeBuoy className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
              }}
            />
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
              }}
              onClick={(e) => {
                e.preventDefault();
                signOut();
              }}
            />
            <SidebarLink
              link={{
                label: cafeName,
                href: "#",
                icon: (
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
          <div className="flex flex-col">
            <p className="hidden md:block text-base font-semibold text-foreground whitespace-nowrap">
              Welcome back, <span className="text-primary">{fullName}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-xl">
            {isDashboardHome && (
              <div className="relative w-full max-w-sm hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 rounded-lg pl-10 p-2 text-sm border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                  autoComplete="off"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground relative" disabled>
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background" />
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
