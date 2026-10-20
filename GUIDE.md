Build a production-ready MVP called "ApplyFast".

The purpose of this application is to reduce the time it takes to apply for software engineering jobs.

Problem Statement

Normally, users find a job posting, open ChatGPT, ask it to write an email, copy the email, open Gmail, paste it, attach their resume, and send it.

This application eliminates that workflow.

Users should fill their profile only once. Afterwards, every application should take less than 30 seconds.

Tech Stack

Frontend
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod validation

Backend
- Next.js Server Actions and Route Handlers
- Prisma ORM
- Neon PostgreSQL

Services
- Resend for sending emails

Authentication
- Better Auth (or Clerk if easier)

File Upload
- Store resumes and save the resume URL in the database.

Project Structure

Use a clean scalable architecture.

app/
components/
features/
lib/
actions/
prisma/
types/

Features

1. Authentication

Allow users to

- Sign Up
- Login
- Logout

Protect all dashboard routes.

---------------------------------------

2. Profile Setup

After signup, redirect the user to complete their profile.

Fields

Full Name
Email
Phone (optional)
Portfolio
LinkedIn
GitHub
Project URLs (up to 3, optional)
Resume Upload

Save this information in the database.

Users can edit it anytime.

---------------------------------------

3. Dashboard

Sidebar

Dashboard
Applications
Profile
Settings

Dashboard cards

Total Applications

Sent Today

Failed

Pending Follow Ups

---------------------------------------

4. New Application

Create a page with a simple form.

Fields

Company Name

Company Email

Role

Recruiter Name (optional)

Email Template

Submit Button

Validation using Zod.

---------------------------------------

5. Email Templates

Create at least one template before sending applications. Templates are stored in Resend and are scoped per user by template alias.

Optional values such as {{{LINKEDIN}}}, {{{GITHUB}}}, {{{PHONE}}}, {{{PROJECT_1}}}, {{{PROJECT_2}}}, and {{{PROJECT_3}}} render nothing when the profile field is empty, so they can be left out of the email.

Subject

Application for {{{ROLE}}}

Body

Hi {{{RECRUITER_NAME}}},

I hope you are doing well.

I came across the opening for {{{ROLE}}} at {{{COMPANY}}} and wanted to express my interest.

I have experience building modern full stack web applications using React, Next.js, Node.js, PostgreSQL, and TypeScript.

You can view my portfolio here:

{{{PORTFOLIO}}}

{{{LINKEDIN}}}

{{{GITHUB}}}

{{{PHONE}}}

{{{PROJECT_1}}}

{{{PROJECT_2}}}

{{{PROJECT_3}}}

I have attached my resume.

Thank you for your time and consideration.

Best regards,

{{{NAME}}}

If recruiter name is empty,

replace

Hi,

instead of

Hi John,

---------------------------------------

6. Send Email

When user clicks Send

Generate subject

Replace all placeholders

Attach the user's resume

Send using Resend

Store application in database

Show loading state

Show success toast

Show error toast

---------------------------------------

7. Applications Table

Display

Company

Role

Company Email

Recruiter

Sent Date

Status

Actions

Actions

View

Resend

Delete

Search by company or role.

---------------------------------------

8. Follow Up

Every application stores

followUpDate

followUpSent

Create an endpoint that can later be called by a cron job.

The endpoint should

Find all applications whose followUpDate is today or earlier

followUpSent = false

Send a follow-up email

Mark followUpSent = true

---------------------------------------

9. Prisma Schema

User

id
name
email
password
portfolio
linkedin
github
phone
resumeUrl
projectUrl1
projectUrl2
projectUrl3
createdAt

Application

id
userId
company
companyEmail
role
recruiterName
subject
body
status
followUpDate
followUpSent
createdAt

Template

Stored in Resend (name, subject, html, published status).
Linked to a user by the template alias prefix.
No local Template table.

---------------------------------------

10. UI

Use shadcn/ui everywhere.

Cards

Tables

Dialog

Dropdown Menu

Input

Textarea

Button

Badge

Toast

Alert Dialog

Responsive layout

Desktop first

Clean modern dashboard similar to Linear, Vercel, or Clerk.

---------------------------------------

11. Code Quality

Use TypeScript everywhere.

Use Server Actions whenever appropriate.

Validate all forms using Zod.

Use React Hook Form.

Keep components reusable.

Avoid duplicated code.

Separate UI and business logic.

Use loading.tsx, error.tsx, and skeletons where appropriate.

Use optimistic UI where it improves UX.

---------------------------------------

12. Future Ready

Keep the architecture modular so AI-generated emails, multiple templates, analytics, scheduled jobs, and application tracking can be added later without major refactoring.

Do NOT implement AI features yet. Build a clean MVP focused on fast email-based job applications.