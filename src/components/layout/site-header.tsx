import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Scissors } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { business } from "@/config/business";
import { useSessionUserId } from "@/features/auth/use-account";

export function SiteHeader() {
  const { data: userId } = useSessionUserId();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isSignedIn = Boolean(userId);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label={`${business.name} home`}>
          <Scissors className="size-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-semibold tracking-wide">
            {business.name}
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/services">Services</Link>
          </Button>
          {isSignedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile">My profile</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/dashboard">My dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create account
                </Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="font-display text-lg">{business.name}</SheetTitle>
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/services" });
                }}
              >
                Services
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: isSignedIn ? "/dashboard" : "/auth" });
                }}
              >
                {isSignedIn ? "My dashboard" : "Sign in"}
              </Button>
              {isSignedIn ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/profile" });
                  }}
                >
                  My profile
                </Button>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
