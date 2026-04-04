# Adding Clerk Auth to a Next.js App

This is a general walkthrough based on how Clerk was added to this project (FlashSRS — a Next.js 16 app with App Router and Tailwind).

---

## 1. Install the package

```bash
npm install @clerk/nextjs
```

---

## 2. Create a Clerk account and app

- Go to [clerk.com](https://clerk.com) and create an account.
- Create a new application, choose your sign-in methods (email, Google, GitHub, etc.).
- From the dashboard, grab your API keys.

---

## 3. Set up environment variables

Create a `.env.local` file at the root:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

You can also set redirect URLs here if you want to override the defaults:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## 4. Wrap the app in `ClerkProvider`

In `app/layout.tsx`, wrap everything in `<ClerkProvider>`. This makes auth state available throughout the app.

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## 5. Add sign-in and sign-up pages

Clerk uses catch-all routes. Create these two files:

**`app/sign-in/[[...sign-in]]/page.tsx`**
```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignIn />
    </div>
  );
}
```

**`app/sign-up/[[...sign-up]]/page.tsx`**
```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignUp />
    </div>
  );
}
```

These render Clerk's hosted UI components, which handle the full auth flow out of the box.

---

## 6. Protect routes with middleware

Create `middleware.ts` at the root of the project:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

This redirects unauthenticated users to `/sign-in` for any non-public route.

---

## 7. Use auth state in your components

In client components, use the `useUser` or `useAuth` hooks:

```tsx
import { useUser } from "@clerk/nextjs";

const { user, isLoaded } = useUser();
```

To show a user avatar/sign-out button, drop in the `UserButton` component anywhere:

```tsx
import { UserButton } from "@clerk/nextjs";

<UserButton />
```

In server components or API routes, use `auth()` from `@clerk/nextjs/server`:

```ts
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
```

---

## 8. Notes for this project specifically

- This app currently uses `localStorage` for all data storage, so Clerk is only handling authentication — there's no per-user backend data yet.
- If you want data to persist per user across devices, you'd need to replace the `localStorage` layer (`lib/storage.ts`) with a real backend (e.g. Convex, Supabase, a custom API) keyed by `userId`.
- The `UserButton` is already rendered in `HomeClient.tsx`, giving users a way to sign out from the main screen.
