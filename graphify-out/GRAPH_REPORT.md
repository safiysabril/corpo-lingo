# Graph Report - .  (2026-06-24)

## Corpus Check
- Corpus is ~37,969 words - fits in a single context window. You may not need a graph.

## Summary
- 774 nodes · 1044 edges · 58 communities (56 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.83)
- Token cost: 31,000 input · 8,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Controllers & Routes|Backend Controllers & Routes]]
- [[_COMMUNITY_Frontend App & Auth UI|Frontend App & Auth UI]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_shadcn UI Sidebar & Overlays|shadcn UI: Sidebar & Overlays]]
- [[_COMMUNITY_AI Providers & Prompts|AI Providers & Prompts]]
- [[_COMMUNITY_Shared Types & Domain Model|Shared Types & Domain Model]]
- [[_COMMUNITY_Frontend Build & Lint Config|Frontend Build & Lint Config]]
- [[_COMMUNITY_Toast Notifications|Toast Notifications]]
- [[_COMMUNITY_shadcn UI Form Inputs|shadcn UI: Form Inputs]]
- [[_COMMUNITY_Frontend TS Config (app)|Frontend TS Config (app)]]
- [[_COMMUNITY_Nx  Root Workspace Config|Nx / Root Workspace Config]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_shadcn Config (components.json)|shadcn Config (components.json)]]
- [[_COMMUNITY_shadcn UI Command & Dialog|shadcn UI: Command & Dialog]]
- [[_COMMUNITY_shadcn UI Menubar|shadcn UI: Menubar]]
- [[_COMMUNITY_Backend Test Tooling|Backend Test Tooling]]
- [[_COMMUNITY_shadcn UI Buttons & Calendar|shadcn UI: Buttons & Calendar]]
- [[_COMMUNITY_TS Config (node)|TS Config (node)]]
- [[_COMMUNITY_Shared TS Config|Shared TS Config]]
- [[_COMMUNITY_shadcn UI Form & Label|shadcn UI: Form & Label]]
- [[_COMMUNITY_shadcn UI Carousel|shadcn UI: Carousel]]
- [[_COMMUNITY_Express App & Error Handling|Express App & Error Handling]]
- [[_COMMUNITY_UI Utilities & Theme Toggle|UI Utilities & Theme Toggle]]
- [[_COMMUNITY_shadcn UI Chart|shadcn UI: Chart]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Backend Package Manifest|Backend Package Manifest]]
- [[_COMMUNITY_shadcn UI Context Menu|shadcn UI: Context Menu]]
- [[_COMMUNITY_shadcn UI Dropdown Menu|shadcn UI: Dropdown Menu]]
- [[_COMMUNITY_shadcn UI Alert Dialog|shadcn UI: Alert Dialog]]
- [[_COMMUNITY_shadcn UI Table|shadcn UI: Table]]
- [[_COMMUNITY_shadcn UI Breadcrumb|shadcn UI: Breadcrumb]]
- [[_COMMUNITY_shadcn UI Drawer|shadcn UI: Drawer]]
- [[_COMMUNITY_shadcn UI Navigation Menu|shadcn UI: Navigation Menu]]
- [[_COMMUNITY_shadcn UI Select|shadcn UI: Select]]
- [[_COMMUNITY_Frontend TS Config (root)|Frontend TS Config (root)]]
- [[_COMMUNITY_shadcn UI Card|shadcn UI: Card]]
- [[_COMMUNITY_shadcn UI Toggle|shadcn UI: Toggle]]
- [[_COMMUNITY_Backend Test TS Config|Backend Test TS Config]]
- [[_COMMUNITY_Jest Config|Jest Config]]
- [[_COMMUNITY_Backend NPM Scripts|Backend NPM Scripts]]
- [[_COMMUNITY_shadcn UI Alert|shadcn UI: Alert]]
- [[_COMMUNITY_shadcn UI Input OTP|shadcn UI: Input OTP]]
- [[_COMMUNITY_shadcn UI Accordion|shadcn UI: Accordion]]
- [[_COMMUNITY_shadcn UI Avatar|shadcn UI: Avatar]]
- [[_COMMUNITY_shadcn UI Tabs|shadcn UI: Tabs]]
- [[_COMMUNITY_shadcn UI Scroll Area|shadcn UI: Scroll Area]]
- [[_COMMUNITY_Express Middleware Stack|Express Middleware Stack]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 75 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 14 edges
4. `compilerOptions` - 13 edges
5. `buildSystemPrompt()` - 12 edges
6. `compilerOptions` - 12 edges
7. `buildUserMessage()` - 9 edges
8. `translateText()` - 8 edges
9. `request()` - 8 edges
10. `translate()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Corpo Lingo Quill Emblem (brand mark)` --conceptually_related_to--> `React SPA Frontend`  [INFERRED]
  apps/frontend/public/icons/icon-512x512.png → docs/frontend.md
- `translations table` --references--> `getHistory()`  [INFERRED]
  docs/database.md → apps/backend/src/controllers/translate.controller.ts
- `Local Dev Infra (DB required)` --references--> `initDb()`  [EXTRACTED]
  docs/local-development.md → apps/backend/src/db/index.ts
- `Password Reset Email Delivery` --references--> `sendPasswordResetEmail()`  [EXTRACTED]
  docs/backend.md → apps/backend/src/services/email.service.ts
- `Prompt Building` --references--> `buildSystemPrompt()`  [EXTRACTED]
  docs/ai-providers.md → apps/backend/src/utils/promptBuilder.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AI Provider Implementations** — services_groq_service_translatetext, services_openai_service_translatetext, services_gemini_service_translatetext, services_ollama_service_translatetext, docs_ai_providers_translation_service_interface [INFERRED 0.90]
- **Password Reset Flow Participants** — controllers_auth_controller_forgotpassword, controllers_auth_controller_resetpassword, services_email_service_sendpasswordresetemail, docs_database_password_reset_tokens_table [INFERRED 0.85]
- **Translate Request Pipeline** — middleware_authenticate_optionalauthenticate, middleware_validate_validatetranslation, controllers_translate_controller_translate, services_ai_factory_translatewithfallback, utils_cache_getcached [INFERRED 0.85]

## Communities (58 total, 2 thin omitted)

### Community 0 - "Backend Controllers & Routes"
Cohesion: 0.07
Nodes (48): cookieOptions(), forgotPassword(), googleAuth(), googleOAuthClient, login(), logout(), me(), register() (+40 more)

### Community 1 - "Frontend App & Auth UI"
Cohesion: 0.06
Nodes (33): deleteHistoryItem(), forgotPassword(), getHistory(), getMe(), googleLogin(), login(), logout(), register() (+25 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.04
Nodes (51): dependencies, class-variance-authority, clsx, cmdk, @corpo-lingo/shared, date-fns, embla-carousel-react, @hookform/resolvers (+43 more)

### Community 3 - "shadcn UI: Sidebar & Overlays"
Cohesion: 0.05
Nodes (38): useIsMobile(), Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+30 more)

### Community 4 - "AI Providers & Prompts"
Cohesion: 0.16
Nodes (24): Lazy Provider Client Init, Pluggable AI Provider System, TranslationService Interface, FORMALITY_LEVELS, generate(), MODES, getTranslationService(), providers (+16 more)

### Community 5 - "Shared Types & Domain Model"
Cohesion: 0.10
Nodes (27): Formality Level, Prompt Building, Translation Mode, pnpm + Nx Monorepo, Shared Types Contract, Docker Deployment, Corpo Lingo App Icon (192px), Corpo Lingo App Icon (512px) (+19 more)

### Community 6 - "Frontend Build & Lint Config"
Cohesion: 0.07
Nodes (28): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+20 more)

### Community 7 - "Toast Notifications"
Cohesion: 0.11
Nodes (24): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+16 more)

### Community 8 - "shadcn UI: Form Inputs"
Cohesion: 0.10
Nodes (11): NavLink, NavLinkCompatProps, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem (+3 more)

### Community 9 - "Frontend TS Config (app)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 10 - "Nx / Root Workspace Config"
Cohesion: 0.10
Nodes (18): analytics, defaultBase, $schema, useDaemonProcess, devDependencies, nx, @types/node, typescript (+10 more)

### Community 11 - "Backend Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, bcryptjs, cookie-parser, @corpo-lingo/shared, cors, dotenv, express, express-rate-limit (+11 more)

### Community 12 - "Backend TS Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleDetection, outDir (+8 more)

### Community 13 - "shadcn Config (components.json)"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 14 - "shadcn UI: Command & Dialog"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 15 - "shadcn UI: Menubar"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 16 - "Backend Test Tooling"
Cohesion: 0.12
Nodes (16): devDependencies, jest, supertest, ts-jest, tsx, @types/bcryptjs, @types/cookie-parser, @types/cors (+8 more)

### Community 17 - "shadcn UI: Buttons & Calendar"
Cohesion: 0.17
Nodes (13): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+5 more)

### Community 18 - "TS Config (node)"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+6 more)

### Community 19 - "Shared TS Config"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, declarationMap, esModuleInterop, module, moduleResolution, outDir, rootDir (+6 more)

### Community 20 - "shadcn UI: Form & Label"
Cohesion: 0.14
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 21 - "shadcn UI: Carousel"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 22 - "Express App & Error Handling"
Cohesion: 0.22
Nodes (9): app, errorHandler(), toMessage(), toStack(), toStatus(), notFound(), router, router (+1 more)

### Community 23 - "UI Utilities & Theme Toggle"
Cohesion: 0.26
Nodes (8): ThemeToggle(), cn(), Badge(), BadgeProps, badgeVariants, ResizableHandle(), ResizablePanelGroup(), Skeleton()

### Community 24 - "shadcn UI: Chart"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 25 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): author, coauthor, description, keywords, license, main, name, private (+1 more)

### Community 26 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 27 - "Backend Package Manifest"
Cohesion: 0.20
Nodes (9): devDependencies, typescript, main, name, scripts, build, dev, types (+1 more)

### Community 28 - "shadcn UI: Context Menu"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 29 - "shadcn UI: Dropdown Menu"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 30 - "shadcn UI: Alert Dialog"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 31 - "shadcn UI: Table"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 32 - "shadcn UI: Breadcrumb"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 33 - "shadcn UI: Drawer"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 34 - "shadcn UI: Navigation Menu"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 35 - "shadcn UI: Select"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 36 - "Frontend TS Config (root)"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, skipLibCheck, files, @/*, references

### Community 37 - "shadcn UI: Card"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 38 - "shadcn UI: Toggle"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 39 - "Backend Test TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, ignoreDeprecations, moduleDetection, extends, include

### Community 40 - "Jest Config"
Cohesion: 0.40
Nodes (5): jest, testEnvironment, testMatch, transform, ^.+\\.ts$

### Community 41 - "Backend NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, start, test

### Community 42 - "shadcn UI: Alert"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 43 - "shadcn UI: Input OTP"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 44 - "shadcn UI: Accordion"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 45 - "shadcn UI: Avatar"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 46 - "shadcn UI: Tabs"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

## Ambiguous Edges - Review These
- `Icons SVG` → `Corpo Lingo Quill Emblem (brand mark)`  [AMBIGUOUS]
  apps/frontend/public/icons.svg · relation: conceptually_related_to

## Knowledge Gaps
- **457 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+452 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Icons SVG` and `Corpo Lingo Quill Emblem (brand mark)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `UI Utilities & Theme Toggle` to `Frontend App & Auth UI`, `shadcn UI: Sidebar & Overlays`, `Toast Notifications`, `shadcn UI: Form Inputs`, `shadcn UI: Command & Dialog`, `shadcn UI: Menubar`, `shadcn UI: Buttons & Calendar`, `shadcn UI: Form & Label`, `shadcn UI: Carousel`, `shadcn UI: Chart`, `shadcn UI: Context Menu`, `shadcn UI: Dropdown Menu`, `shadcn UI: Alert Dialog`, `shadcn UI: Table`, `shadcn UI: Breadcrumb`, `shadcn UI: Drawer`, `shadcn UI: Navigation Menu`, `shadcn UI: Select`, `shadcn UI: Card`, `shadcn UI: Toggle`, `shadcn UI: Alert`, `shadcn UI: Input OTP`, `shadcn UI: Accordion`, `shadcn UI: Avatar`, `shadcn UI: Tabs`, `shadcn UI: Scroll Area`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `React SPA Frontend` connect `Frontend App & Auth UI` to `Backend Controllers & Routes`, `Shared Types & Domain Model`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Controllers & Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06662770309760374 - nodes in this community are weakly interconnected._
- **Should `Frontend App & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0641025641025641 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._