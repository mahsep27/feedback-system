// /api/feedback.js
// GET: Fetch feedback record details (type, status)
// POST: Update feedback record with form data (handles both Demo and Tuition tables)

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    // Two separate tables
    const DEMO_TABLE = 'Demo Feedback';
    const TUITION_TABLE = 'Tuition Feedback';

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // GET: Fetch feedback record by Feedback ID
    if (req.method === 'GET') {
        const { id, type } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Missing feedback ID' });
        }

        if (!type || !['demo', 'tuition'].includes(type.toLowerCase())) {
            return res.status(400).json({ error: 'Missing or invalid type. Use type=demo or type=tuition' });
        }

        const tableName = type.toLowerCase() === 'demo' ? DEMO_TABLE : TUITION_TABLE;

        try {
            const filterFormula = `{Feedback ID} = ${id}`;
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`;

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
                type: type.toLowerCase() === 'demo' ? 'Demo' : 'Tuition',
                status: record.fields['Status'] || 'Pending',
                tutorName: record.fields['Tutor Name'] || ''
            });

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST: Update feedback record
    if (req.method === 'POST') {
        try {
            const body = req.body;
            const { recordId, type } = body;

            console.log('Received data:', JSON.stringify(body, null, 2));

            if (!recordId) {
                return res.status(400).json({ error: 'Missing record ID' });
            }

            if (!type) {
                return res.status(400).json({ error: 'Missing type' });
            }

            const tableName = type === 'Demo' ? DEMO_TABLE : TUITION_TABLE;

            let airtableRecord = {
                fields: {
                    "Status": "Submitted",
                    "Submitted At": new Date().toISOString().split('T')[0]
                }
            };

            // Handle Demo form
            if (type === 'Demo') {
                const { on_time, teaching_rating, demo_decision } = body;

                if (!on_time || !teaching_rating || !demo_decision) {
                    return res.status(400).json({ error: 'Please complete all required fields' });
                }

                airtableRecord.fields["On Time"] = on_time;
                airtableRecord.fields["Teaching Rating"] = parseInt(teaching_rating) || null;
                airtableRecord.fields["Demo Decision"] = demo_decision;

            } 
            // Handle Tuition form
            else {
                const {
                    email,
                    punctuality,
                    teaching_quality,
                    communication,
                    subject_knowledge,
                    service_satisfaction,
                    would_recommend,
                    comments
                } = body;

                if (!email) {
                    return res.status(400).json({ error: 'Email is required' });
                }

                if (!punctuality || !teaching_quality || !communication || !subject_knowledge || !service_satisfaction || !would_recommend) {
                    return res.status(400).json({ error: 'Please complete all required fields' });
                }

                // Map service satisfaction to full Airtable option text
                const serviceSatisfactionMap = {
                    'Excellent': 'Excellent – Very professional and satisfied with the tutor and service',
                    'Good': 'Good – Satisfied, but there\'s some room for improvement',
                    'Average': 'Average – It was okay, not great or poor',
                    'Poor': 'Poor – Not satisfied with the tutor or service',
                    'Very Poor': 'Very Poor – Extremely dissatisfied with the experience'
                };

                airtableRecord.fields["Email"] = email;
                airtableRecord.fields["Punctuality"] = parseInt(punctuality) || null;
                airtableRecord.fields["Teaching Quality"] = parseInt(teaching_quality) || null;
                airtableRecord.fields["Communication"] = parseInt(communication) || null;
                airtableRecord.fields["Subject Knowledge"] = parseInt(subject_knowledge) || null;
                airtableRecord.fields["Service Satisfaction"] = serviceSatisfactionMap[service_satisfaction] || service_satisfaction;
                airtableRecord.fields["Would Recommend"] = would_recommend;
                airtableRecord.fields["Comments"] = comments || "";
            }

            console.log('Sending to Airtable:', JSON.stringify(airtableRecord, null, 2));

            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;

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
