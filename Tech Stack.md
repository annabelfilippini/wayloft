Front end
1. next.js 15 - react framework - handles routing, server side rendering and API routes so i dont have to wire myself. 
	1. use app router to organize pages using folders instead of a flat pages/directory 
2. tailwind CSS v4 - way to style using classes and not CSS files 
3. shadcn/ui - collection of pre built components like buttons, modals, dropdowns, forms, etc 
	1. so i can copy into code and customize UI instead of downloading 
4. tanstack query - handles all data fetching, calling APIs, caching responses handling loading and error states 
5. zustand - used for things that need to be shared across the whole app like the logged in user or the shopping cart 
6. react hook form and zod - work together for forms 
	1. react hook form manages form inputs and submission
	2. zod validates the data matches what you expect 
7. serwist - handles service work so app can work as a PWA (installable on phones, works offline, can send push notifications)

Back end 
1. next.js API routes - backend endpoints that live inside Next.js app. create files in your app/api/folder and they become API endpoints automatically. keeps everything in one codebase 
2. hono on cloudflare workers - for when you need code running at the edge (on servers physically close to your users around the world)
3. trigger.dev - handles background jobs - tasks that take too long to run during the normal request. ex - sending emails, processing uploads, syncing data, generating reports 
	1. you write TypeScript and Trigger.dev handles execution, retires and monitoring 
	2. Maybe we could use agents here? 
4. python w playwright + beautiful on railway - scraping setup. playwright is a browser automation tool (can open web pages, click buttons, wait for javascript to load). beautiful soup parses HTML once you have it 
	1. so together the scrape sites that need JavaScript to render 
	2. railway is where you host it. a simple platform for running containers 
	3. need scrapers separate from main app bc they are resource heavy and might need different scaling 

Data 
1. supabase (postgre SQL) - main database - where core data lives - users, posts, orders, whatever app stores permanently 
2. upstash redis - for caching, storing temp data that you need to access fast 
3. cloudflare R2 - object storage for files, images, PDFs, videos, user uploads 
*supabase for structured data i query, upstash for fast temp data, R2 for files 
^ will have MCPs connecting these to Claude 


Infrastructure
- Vercel - where main Next.js app lives 
	- it is built by the same team that makes Next.js so deployment is easy, push to github, it builds and deploys automatically. Handles SSL, domains, preview deployments for branches and scales. Frontend and API routes all live here 
- Cloudflare Workers - for edge functions 
	- small pieces of code that run globally, close to users 
	- use this alongside Vercel for redirects, API endpoints that need to fun very fast
	- not the whole app, just specific pieces that benefit from being at the edge 
- Railway - container hosting platform
	- it is running python scrapers separately from main app. 
- GitHut Actions - CI/CD - automated workflows that run when you push code. 
	- tests run automatically, builds happen, deployments trigger
- Sentry - cathces errors in production 
	- when something breaks for a user, sentry captures stack trace, browser info and context so i can debug 
- PostHog - product analytics 
	- who's using app, what features they click, where they drop off 
- Resend - sends transactional emails 
	- password resets, receipts, notifications 
- Stripe - handles payments 


when putting agents in 