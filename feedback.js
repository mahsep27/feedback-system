// /api/feedback.js
// Vercel Serverless Function to handle feedback submission

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            tutor_id,
            tuition_id,
            type,
            email,
            punctuality,
            teaching_quality,
            communication,
            subject_knowledge,
            service_satisfaction,
            would_recommend,
            comments,
            suggestions
        } = req.body;

        // Validate required fields
        if (!tutor_id || !tuition_id) {
            return res.status(400).json({ error: 'Missing tutor_id or tuition_id' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!punctuality || !teaching_quality || !communication || !subject_knowledge || !service_satisfaction || !would_recommend) {
            return res.status(400).json({ error: 'Please complete all rating fields' });
        }

        // Airtable configuration
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_FEEDBACK_TABLE || 'Feedback';

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            console.error('Missing Airtable configuration');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Map service satisfaction value to label
        const serviceLabels = {
            '4': 'Excellent',
            '3': 'Good',
            '2': 'Average',
            '1': 'Poor'
        };

        // Build Airtable record
        const airtableRecord = {
            fields: {
                "Tutor ID": tutor_id,
                "Tuition ID": tuition_id,
                "Type": type || "tuition",  // demo or tuition
                "Email": email,
                "Punctuality": parseInt(punctuality),
                "Teaching Quality": parseInt(teaching_quality),
                "Communication": parseInt(communication),
                "Subject Knowledge": parseInt(subject_knowledge),
                "Service Satisfaction": serviceLabels[service_satisfaction] || service_satisfaction,
                "Would Recommend": would_recommend,
                "Comments": comments || "",
                "Suggestions": suggestions || "",
                "Submitted At": new Date().toISOString()
            }
        };

        // Send to Airtable
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

        const airtableResponse = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airtableRecord)
        });

        const airtableResult = await airtableResponse.json();

        if (!airtableResponse.ok) {
            console.error('Airtable error:', airtableResult);
            return res.status(500).json({ 
                error: 'Failed to save feedback',
                details: airtableResult.error?.message || 'Unknown error'
            });
        }

        // Success
        return res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully',
            recordId: airtableResult.id
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
