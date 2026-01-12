# KEEP TUTORS Feedback System

A simple feedback collection system that integrates with Airtable.

## How It Works

```
Airtable Automation → Generates feedback URL → Client clicks link
                                                      ↓
                                            Sees clean form (IDs hidden)
                                            Title changes based on type
                                                      ↓
                                            Submits feedback
                                                      ↓
                                    Vercel API → Creates Airtable record
```

## URL Structure

```
https://your-app.vercel.app/feedback?tutor_id=TID-001&tuition_id=TUN-045&type=tuition
https://your-app.vercel.app/feedback?tutor_id=TID-001&tuition_id=TUN-045&type=demo
```

| Parameter    | Required | Values           | Description                     |
|--------------|----------|------------------|---------------------------------|
| tutor_id     | Yes      | Any string       | Tutor ID from Airtable          |
| tuition_id   | Yes      | Any string       | Tuition/Demo ID from Airtable   |
| type         | No       | demo / tuition   | Changes form title (default: tuition) |

## Form Fields

**Email** (required):
- Client's email address

**Tutor Ratings (1-5 stars, all required):**
- Punctuality
- Teaching Quality
- Communication
- Subject Knowledge

**KEEP TUTORS Satisfaction (dropdown, required):**
- 🌟 Excellent – Very professional and satisfied with the tutor and service
- 👍 Good – Satisfied, but there's some room for improvement
- 😐 Average – It was okay, not great or poor
- 👎 Poor – Not satisfied with the tutor or service

**Other (required):**
- Would Recommend (Yes / Maybe / No)

**Optional:**
- Comments (text)
- Suggestions for Improvement (text)

**Note:** Overall Rating is NOT collected in the form. Calculate it in Airtable using a formula:
```
AVERAGE({Punctuality}, {Teaching Quality}, {Communication}, {Subject Knowledge})
```

## Setup Instructions

### 1. Create Airtable "Feedback" Table

Create a new table called `Feedback` with these fields:

| Field Name           | Field Type    | Notes                                    |
|----------------------|---------------|------------------------------------------|
| Tutor ID             | Single line   | Or Link to Tutors table                  |
| Tuition ID           | Single line   | Or Link to Tuitions table                |
| Type                 | Single select | Options: demo, tuition                   |
| Email                | Email         | Client's email                           |
| Punctuality          | Number        | 1-5                                      |
| Teaching Quality     | Number        | 1-5                                      |
| Communication        | Number        | 1-5                                      |
| Subject Knowledge    | Number        | 1-5                                      |
| Overall Rating       | Formula       | `AVERAGE({Punctuality}, {Teaching Quality}, {Communication}, {Subject Knowledge})` |
| Service Satisfaction | Single select | Options: Excellent, Good, Average, Poor  |
| Would Recommend      | Single select | Options: Yes, Maybe, No                  |
| Comments             | Long text     | Optional                                 |
| Suggestions          | Long text     | Optional                                 |
| Submitted At         | Date          | Include time field                       |

### 2. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Navigate to this folder
cd feedback-system

# Deploy
vercel

# Add environment variables (do this once)
vercel env add AIRTABLE_API_KEY
vercel env add AIRTABLE_BASE_ID

# Redeploy after adding env vars
vercel --prod
```

### 3. Get Your Airtable Credentials

- **API Key**: Go to https://airtable.com/create/tokens and create a Personal Access Token with `data.records:write` scope
- **Base ID**: Open your base, look at the URL: `https://airtable.com/appXXXXXXXXXXX/...` - the `appXXXXXXXXXXX` part is your Base ID

### 4. Configure Airtable Automations

Create TWO automations in Airtable:

#### Automation 1: Demo Feedback
**Trigger**: When demo is completed (e.g., "Demo Status = Completed")

**Action**: Send WhatsApp/Email with this URL:
```
https://your-vercel-app.vercel.app/feedback?tutor_id={Tutor ID}&tuition_id={Tuition ID}&type=demo
```

#### Automation 2: Tuition Feedback
**Trigger**: When tuition milestone reached (e.g., after 1 month, or on completion)

**Action**: Send WhatsApp/Email with this URL:
```
https://your-vercel-app.vercel.app/feedback?tutor_id={Tutor ID}&tuition_id={Tuition ID}&type=tuition
```

## What Client Sees

**Demo Feedback** (`type=demo`):
- Title: "Demo Feedback"
- Section: "Rate the Demo Session"

**Tuition Feedback** (`type=tuition`):
- Title: "Tuition Feedback"  
- Section: "Rate the Tutor"

All IDs are completely hidden from the client - they only exist in the URL.

## Testing

1. Deploy the app
2. Test Demo form: `https://your-app.vercel.app/feedback?tutor_id=TEST-001&tuition_id=TEST-001&type=demo`
3. Test Tuition form: `https://your-app.vercel.app/feedback?tutor_id=TEST-001&tuition_id=TEST-001&type=tuition`
4. Check your Airtable Feedback table for the new records

## Customization

### Change Branding

Update the logo and colors in the `<style>` section of `feedback.html`:

```css
:root {
    --primary: #2563eb;      /* Your brand color */
    --primary-dark: #1d4ed8;  /* Darker shade for hover */
    --star-active: #fbbf24;   /* Star color when selected */
}

.logo {
    /* Update with your logo or text */
}
```

## Troubleshooting

**"Server configuration error"**
- Make sure you've added the environment variables to Vercel
- Redeploy after adding env vars

**"Failed to save feedback"**
- Check that your Airtable API key has write permissions
- Verify the table name matches exactly (case-sensitive)
- Check field names match exactly

**Form shows "Invalid Link"**
- The URL is missing `tutor_id` or `tuition_id` parameters
- Check your Airtable automation is including both parameters
