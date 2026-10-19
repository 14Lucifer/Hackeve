# User Guide

The portal has three roles, each picked as a tab on the sign-in page:

| Role | Signs in with | Main job |
| --- | --- | --- |
| **Participant** | Registered email only | Submit the team's project |
| **Judge** | Username + password from the admin | Score the finalists |
| **Admin** | Username + password | Run the event |

## Event workflow at a glance

1. Admin sets up branding and deadlines, then registers participant emails.
2. Participants form teams and submit before the submission deadline.
3. Admin picks up to 10 finalists and writes 3 questions for each.
4. Admin creates up to 3 judge accounts. Judges score the finalists before the judging deadline.
5. Admin reviews rankings and publishes them.

---

## Admin

### Set up the event (Settings)
- **Event Branding**: set the **Event Name** (e.g. "AI Hackathon"), an optional **Organizers** line (e.g. "Company A · Company B"), and an optional **logo** (PNG/JPG/WEBP/GIF/SVG, up to 2 MB). The preview shows how the login page will look. If there is no logo, the organizer line or event name is shown as text.
- **Submission Deadline**: participants can't submit or edit after this time. Times use your browser's time zone.
- **Judging**: set the **Judging Deadline** and turn on **Publish rankings** when results are ready for judges to see.
- **Admin Credentials**: change your username or password. You must enter your current password.

### Register participants (Participants)
- **Import CSV**: a single column of emails, with or without an `email` header. See `sample-emails.csv`.
- **Add User**: register a single email.
- Search, **Lock**/**Unlock** (a locked user can't sign in), or **Delete**. Select several rows to use bulk actions.

### Review submissions (Submissions)
- The table lists every team with its status (Draft / Submitted).
- **View** opens a project's details, files, screenshots, and video.
- **Download** gets one project as a zip.
- Select rows and click **Download Selected**, or use **Download All**. You get one zip that contains a separate zip per project, plus a `manifest.csv`.
- **Export CSV** exports all submission data, without the files.

### Choose finalists (Finalists)
- Only **submitted** projects are listed. Mark up to **10** as finalists.
- Each finalist needs exactly **3 recommended questions** for judges to ask. Save them on the finalist's card.

### Create judges (Judges)
- Create up to **3** judge accounts, each with a display name, a username, and a password of at least 8 characters. Give the credentials to each judge yourself; the portal doesn't send email.
- Reset a judge's password, lock or unlock a judge, or delete one (deleting also removes that judge's scores).
- Each judge's progress shows how many finalists they've scored.

### Rankings
- **Overall** averages all judges' scores. Each judge's tab shows their individual ranking.
- The top three are marked 🥇 🥈 🥉.
- Judges see rankings only after you turn on **Publish rankings** in Settings.

---

## Participant

1. **Sign in**: open the portal, stay on the **Participant** tab, and enter your registered email. If you're told the email isn't registered, contact the organizers.
2. **Start your submission**: open **Submission**. Each team has one shared submission; one teammate creates it.
3. **Fill in the details**: Team Name, Project Name, and Description are required.
4. **Add team members**: use **Search by email** to find teammates (they must be registered) and add them. Everyone on the team can see and edit the same submission.
5. **Upload files**
   - **Project Summary** (required): PDF, DOC, DOCX, TXT, MD, or ZIP, up to 25 MB
   - **Screenshots**: PNG, JPG, WEBP, or GIF, up to 20 images of 10 MB each
   - **Demo Video**: MP4, MOV, WEBM, or MKV, up to 2 GB. Keep the page open until the upload finishes.
6. **Save Draft** to keep your progress, then click **Submit** when you're ready.
7. **Make changes**: you can edit and **Resubmit** until the deadline. The countdown at the top shows the time left. After the deadline, the submission becomes read-only.

---

## Judge

The judge portal works on both phones and laptops.

1. **Sign in**: choose the **Judge** tab and enter the username and password the admin gave you.
2. **Finalists**: the home page lists every finalist, shows your progress, and shows the judging deadline.
3. **Review a project**: open a finalist to see its description, team members, summary file, screenshots, demo video, and the **recommended questions** to ask the team.
4. **Score**: in **Your Scorecard**, give each category a score from 1 (weak) to 5 (excellent):

   | Category | Weight |
   | --- | --- |
   | Value & Practicality | 30% |
   | Creativity & Differentiation | 30% |
   | AI Application & Technical Quality | 20% |
   | Product Completeness & UX | 10% |
   | Feasibility & Responsible AI | 10% |

   The weighted total updates as you score. You can add private notes. Click **Save Score** once all five categories have a score (later, **Save Changes**).
5. **Edit**: reopen a project to change your scores at any time before the judging deadline.
6. **Rankings**: once the admin publishes results, **Rankings** shows the overall result and your own ranking.
