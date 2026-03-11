"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Sliders, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
    const { user, updateUserMetadata } = useAuth();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [cafeName, setCafeName] = useState(user?.user_metadata?.cafe_name || "");

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const { error } = await updateUserMetadata({
            cafe_name: cafeName,
        });

        setIsSaving(false);
        if (error) {
            toast({
                title: "Error",
                description: "Failed to update profile: " + error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Profile updated successfully.",
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your cafe profile and application preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <Sliders className="h-4 w-4" /> Preferences
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cafe Profile</CardTitle>
                            <CardDescription>Update your public cafe information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cafeName">Cafe Name</Label>
                                <Input
                                    id="cafeName"
                                    value={cafeName}
                                    onChange={(e) => setCafeName(e.target.value)}
                                    placeholder="Enter your cafe name"
                                />
                            </div>
                            <div className="space-y-2 opacity-50">
                                <Label htmlFor="email">Registration Email</Label>
                                <Input id="email" value={user?.email || ""} disabled />
                                <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Preferences</CardTitle>
                            <CardDescription>Customize how the dashboard looks for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label>Dashboard View</Label>
                                    <p className="text-xs text-muted-foreground font-normal">Choose between a spacious grid or a concise list.</p>
                                </div>
                                <Select defaultValue="grid" disabled>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Grid View" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grid">Grid View</SelectItem>
                                        <SelectItem value="list">List View</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive">Advanced Controls</CardTitle>
                            <CardDescription>Manage sensitive account operations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled>
                                Reset Password
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
