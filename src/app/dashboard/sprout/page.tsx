"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShoppingBag,
    CalendarDays,
    Check,
    ChefHat,
    Truck,
    X,
    Clock,
    Users,
    RefreshCw,
    MapPin,
    Phone,
    MessageSquare,
    Loader2,
    Package,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    fetchOrders,
    fetchReservations,
    updateOrderStatus,
    updateReservationStatus,
    type Order,
    type Reservation,
} from "@/lib/sprout-db";
import { useToast } from "@/hooks/use-toast";

type Tab = "orders" | "reservations";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    placed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    preparing: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    out_for_delivery: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    refunded: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
    unknown: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
};

function StatusBadge({ status }: { status: string | undefined | null }) {
    const safeStatus = (status ?? "unknown").toLowerCase();
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
                statusColors[safeStatus] || "bg-gray-100 text-gray-800"
            )}
        >
            {safeStatus.replace(/_/g, " ")}
        </span>
    );
}

export default function SproutDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("orders");
    const [orders, setOrders] = useState<Order[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ordersData, reservationsData] = await Promise.all([
                fetchOrders(),
                fetchReservations(),
            ]);
            setOrders(ordersData);
            setReservations(reservationsData);
        } catch {
            console.error("Failed to load sprout data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleOrderAction = async (orderId: string, status: Order["status"]) => {
        setUpdatingId(orderId);
        const { error } = await updateOrderStatus(orderId, status);
        if (error) {
            toast({ title: "Error", description: error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: `Order ${status.replace(/_/g, " ")}` });
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status } : o))
            );
        }
        setUpdatingId(null);
    };

    const handleReservationAction = async (
        reservationId: string,
        status: Reservation["status"]
    ) => {
        setUpdatingId(reservationId);
        const { error } = await updateReservationStatus(reservationId, status);
        if (error) {
            toast({ title: "Error", description: error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: `Reservation ${status}` });
            setReservations((prev) =>
                prev.map((r) => (r.id === reservationId ? { ...r, status } : r))
            );
        }
        setUpdatingId(null);
    };

    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "placed").length;
    const activeOrders = orders.filter((o) =>
        ["accepted", "preparing", "out_for_delivery"].includes(o.status)
    ).length;
    const pendingReservations = reservations.filter(
        (r) => r.status === "pending"
    ).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground">
                        Manage orders and table reservations from Sprout consumers
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-xl bg-amber-200/50 dark:bg-amber-800/30">
                            <Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">N/A</p>
                            <p className="text-sm text-muted-foreground">Pending Orders</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-xl bg-blue-200/50 dark:bg-blue-800/30">
                            <Package className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">N/A</p>
                            <p className="text-sm text-muted-foreground">Active Orders</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-violet-200/50 dark:border-violet-800/30">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 rounded-xl bg-violet-200/50 dark:bg-violet-800/30">
                            <CalendarDays className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingReservations}</p>
                            <p className="text-sm text-muted-foreground">Pending Bookings</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Capsule Tab Switcher */}
            <div className="flex justify-center">
                <div className="relative inline-flex items-center bg-muted/60 dark:bg-muted/30 rounded-full p-1 border border-border/50 backdrop-blur-sm">
                    <motion.div
                        className="absolute inset-y-1 rounded-full bg-background shadow-md border border-border/50"
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                            left: activeTab === "orders" ? "4px" : "50%",
                            right: activeTab === "orders" ? "50%" : "4px",
                        }}
                    />
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={cn(
                            "relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-200",
                            activeTab === "orders"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Live Orders
                        {pendingOrders > 0 && (
                            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                                {pendingOrders}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("reservations")}
                        className={cn(
                            "relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-200",
                            activeTab === "reservations"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        <CalendarDays className="h-4 w-4" />
                        Table Reservations
                        {pendingReservations > 0 && (
                            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                                {pendingReservations}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === "orders" ? (
                    <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Order management is currently under development. You&apos;ll be able to manage Sprout orders here soon!
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="reservations"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : reservations.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="p-4 rounded-full bg-muted mb-4">
                                        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">
                                        No reservations yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        Table bookings from Sprout users will appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reservations.map((reservation) => (
                                    <Card
                                        key={reservation.id}
                                        className={cn(
                                            "relative overflow-hidden transition-all hover:shadow-md",
                                            reservation.status === "pending" &&
                                            "border-amber-200 dark:border-amber-800/40"
                                        )}
                                    >
                                        {reservation.status === "pending" && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                                        )}
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-semibold">
                                                    {reservation.consumer_name}
                                                </CardTitle>
                                                <StatusBadge status={reservation.status} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {new Date(
                                                            reservation.reservation_date
                                                        ).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>{reservation.reservation_time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {reservation.guest_count} guest
                                                        {reservation.guest_count > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                {reservation.consumer_phone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span>{reservation.consumer_phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {reservation.notes && (
                                                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5 italic">
                                                    &ldquo;{reservation.notes}&rdquo;
                                                </p>
                                            )}
                                            {reservation.status === "pending" && (
                                                <div className="flex gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        disabled={updatingId === reservation.id}
                                                        onClick={() =>
                                                            handleReservationAction(
                                                                reservation.id,
                                                                "confirmed"
                                                            )
                                                        }
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="flex-1 gap-1.5"
                                                        disabled={updatingId === reservation.id}
                                                        onClick={() =>
                                                            handleReservationAction(
                                                                reservation.id,
                                                                "cancelled"
                                                            )
                                                        }
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
