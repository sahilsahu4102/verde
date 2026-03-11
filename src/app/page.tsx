"use client"

import { useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { ArrowRight, Loader2, Leaf, Upload, ImageIcon } from "lucide-react"
import { uploadCafeImageAction } from "@/app/actions/upload-cafe-image"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import type { GeocodedAddress } from "@/components/ui/address-autocomplete"
import { Header } from "@/components/ui/header-1"
import { HeroSection } from "@/components/ui/hero-1"
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects"
import { HowItWorks } from "@/components/ui/how-it-works"
import { RadialGlowBackground } from "@/components/ui/radial-glow-background"
import { Pricing } from "@/components/ui/pricing"

const verdePlans = [
  {
    name: "STARTER",
    price: "499",
    yearlyPrice: "399",
    period: "per month",
    features: [
      "Unlimited dish analysis",
      "AI reformulation & nutrition",
      "10 procurement plans/month",
      "5 marketing generations/month",
      "Community support",
    ],
    description: "Perfect for small cafés starting their plant-based journey",
    buttonText: "Get Started",
    href: "#form",
    isPopular: false,
    planId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID || "",
  },
  {
    name: "GROWTH",
    price: "999",
    yearlyPrice: "799",
    period: "per month",
    features: [
      "Everything in Starter",
      "Unlimited procurement plans",
      "Unlimited marketing content",
      "3 AI video reels/month",
      "Live price scraping",
      "Priority email support",
    ],
    description: "Ideal for growing restaurants scaling their plant-based menu",
    buttonText: "Get Started",
    href: "#form",
    isPopular: true,
    planId: process.env.NEXT_PUBLIC_RAZORPAY_GROWTH_PLAN_ID || "",
  },
  {
    name: "PRO",
    price: "2499",
    yearlyPrice: "1999",
    period: "per month",
    features: [
      "Everything in Growth",
      "10 AI video reels/month",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "Priority support & SLA",
    ],
    description: "For restaurant chains with advanced needs",
    buttonText: "Contact Sales",
    href: "#form",
    isPopular: false,
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID || "",
  },
]

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  cafeName: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
})

export default function LoginPage() {
  const { signIn, signUp, isLoading: authLoading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [cafeLocation, setCafeLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [cafeImageFile, setCafeImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      cafeName: "",
      fullName: "",
      phone: "",
      description: "",
      address: "",
      openingHours: "09:00",
      closingHours: "22:00",
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCafeImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSignInClick = () => {
    setIsSignUp(false)
    setAuthError(null)
    setSignUpSuccess(false)
    scrollToForm()
  }

  const handleGetStartedClick = () => {
    setIsSignUp(true)
    setAuthError(null)
    setSignUpSuccess(false)
    scrollToForm()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setAuthError(null)
    setSignUpSuccess(false)

    if (isSignUp) {
      // First sign up the user (image will be uploaded after we have the user ID)
      const { error } = await signUp(values.email, values.password, {
        cafeName: values.cafeName,
        fullName: values.fullName,
        phone: values.phone,
        description: values.description,
        address: values.address,
        imageFile: cafeImageFile,
        latitude: cafeLocation?.lat,
        longitude: cafeLocation?.lon,
        openingHours: values.openingHours,
        closingHours: values.closingHours,
      })
      if (error) {
        setAuthError(error)
      } else {
        setSignUpSuccess(true)
        setIsSignUp(false)
        form.reset()
        setCafeImageFile(null)
        setImagePreview(null)
      }
    } else {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        setAuthError(error)
      }
    }

    setIsSubmitting(false)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <RadialGlowBackground className="flex w-full flex-col min-h-screen">
      <Header onSignIn={handleSignInClick} onGetStarted={handleGetStartedClick} />
      <main className="grow relative">
        <HeroSection onGetStarted={handleGetStartedClick} />

        {/* Features Section */}
        <section id="features" className="relative">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="pt-16 pb-4 text-center text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to <span className="text-primary">transform your menu</span>
            </h2>
            <p className="mx-auto max-w-2xl text-center text-muted-foreground mb-4">
              From dish analysis to marketing content — Verde handles every step of your plant-based menu transformation.
            </p>
          </div>
          <FeaturesSectionWithHoverEffects />
        </section>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Pricing Section */}
        <section id="pricing" className="relative">
          <Pricing
            plans={verdePlans}
            title="Simple, Transparent Pricing"
            description={"Choose the plan that fits your restaurant\nAll plans include access to our platform and dedicated support."}
          />
        </section>

        {/* Auth Form Section */}
        <section ref={formRef} id="form" className="relative pb-12 pt-6">
          <div className="mx-auto w-full max-w-md px-4">
            {/* Form Card */}
            <div className="rounded-2xl border bg-card/80 backdrop-blur-md p-8 shadow-2xl space-y-6 relative border-white/10">
              <div className="flex items-center justify-center gap-2 pb-2">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold tracking-wider text-foreground">VERDE</span>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {isSignUp
                    ? "Sign up to start transforming your café menu"
                    : "Sign in to access your café dashboard"}
                </p>
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {signUpSuccess && (
                <Alert>
                  <AlertDescription>
                    ✅ Account created! Please check your email for verification, then sign in.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@yourcafe.com" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isSignUp && (
                    <>
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. John Doe" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. +1 234 567 890" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cafeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Café / Restaurant Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Green Leaf Café" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Description</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Organic plant-based cuisine" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Address</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                value={field.value || ""}
                                onChange={(val) => field.onChange(val)}
                                onSelect={(result: GeocodedAddress) => {
                                  field.onChange(result.display_name);
                                  setCafeLocation({ lat: result.lat, lon: result.lon });
                                }}
                                placeholder="Start typing your address..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Cafe Image</label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background p-6 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover" />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">Click to upload an image</span>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                          {cafeImageFile && (
                            <span className="text-xs text-primary">{cafeImageFile.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="openingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} className="bg-background" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="closingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Closing Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} className="bg-background" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Password</FormLabel>
                          {!isSignUp && (
                            <Link href="#" className="text-xs text-primary hover:underline">
                              Forgot password?
                            </Link>
                          )}
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="Min 6 characters" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSignUp ? "Creating account..." : "Signing in..."}</>
                    ) : (
                      <>{isSignUp ? "Create Account" : "Sign in to Dashboard"} <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "New to VERDE?"}
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setIsSignUp(false); setAuthError(null); setSignUpSuccess(false); }}
                      className="font-semibold text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New to VERDE?{' '}
                    <button
                      onClick={() => { setIsSignUp(true); setAuthError(null); setSignUpSuccess(false); }}
                      className="font-semibold text-primary hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              © 2024 VERDE. Sustainable dining, powered by AI.
            </p>
          </div>
        </section>
      </main>
    </RadialGlowBackground>
  )
}
