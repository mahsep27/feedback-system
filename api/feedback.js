// /api/feedback.js
// GET: Fetch feedback record details (type, status)
// POST: Update feedback record with form data

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_FEEDBACK_TABLE || 'Feedback';

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // GET: Fetch feedback record by Feedback ID (auto-number)
    if (req.method === 'GET') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Missing feedback ID' });
        }

        try {
            // Search for record by Feedback ID field
            const filterFormula = `{Feedback ID} = ${id}`;
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Airtable error:', data);
                return res.status(500).json({ error: 'Failed to fetch feedback record' });
            }

            if (!data.records || data.records.length === 0) {
                return res.status(404).json({ error: 'Feedback record not found' });
            }

            const record = data.records[0];
            
            return res.status(200).json({
                recordId: record.id,
                type: record.fields['Feedback Type'] || 'tuition',
                status: record.fields['Status'] || 'Pending'
            });

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST: Update feedback record
    if (req.method === 'POST') {
        try {
            const {
                id,
                recordId,
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

            console.log('Received data:', JSON.stringify(req.body, null, 2));

            if (!recordId) {
                return res.status(400).json({ error: 'Missing record ID' });
            }

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            if (!punctuality || !teaching_quality || !communication || !subject_knowledge || !service_satisfaction || !would_recommend) {
                return res.status(400).json({ error: 'Please complete all required fields' });
            }

            // Update the existing record
            // Note: Rating fields in Airtable expect integers (1-5 for 5-star rating)
            const airtableRecord = {
                fields: {
                    "Email": email,
                    "Punctuality": parseInt(punctuality) || null,
                    "Teaching Quality": parseInt(teaching_quality) || null,
                    "Communication": parseInt(communication) || null,
                    "Subject Knowledge": parseInt(subject_knowledge) || null,
                    "Service Satisfaction": service_satisfaction,
                    "Would Recommend": would_recommend,
                    "Comments": comments || "",
                    "Suggestions": suggestions || "",
                    "Status": "Submitted",
                    "Submitted At": new Date().toISOString().split('T')[0]
                }
            };

            console.log('Sending to Airtable:', JSON.stringify(airtableRecord, null, 2));

            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${recordId}`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(airtableRecord)
            });

            const result = await response.json();

            console.log('Airtable response:', JSON.stringify(result, null, 2));

            if (!response.ok) {
                console.error('Airtable error:', result);
                return res.status(500).json({ 
                    error: result.error?.message || 'Failed to update feedback',
                    details: result.error
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Feedback submitted successfully'
            });

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
