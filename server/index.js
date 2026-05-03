const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { generatePDF } = require('./utils/pdfGenerator');

const app = express();
const PORT = 3000;

// Logging function
function logUsage(userName) {
    try {
        const logPath = path.join(__dirname, 'usage_logs.csv');
        const timestamp = new Date().toLocaleString();
        const cleanName = (userName || 'Anonymous').replace(/,/g, ''); // Remove commas to prevent CSV issues
        const logEntry = `${timestamp},${cleanName}\n`;
        
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, 'Timestamp,UserName\n');
        }
        fs.appendFileSync(logPath, logEntry);
    } catch (err) {
        console.error('Logging error:', err);
    }
}

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['text/csv', 'application/vnd.ms-excel'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/download-sample', (req, res) => {
    const filePath = path.join(__dirname, 'sample.csv');
    res.download(filePath, 'sample_diary_format.csv');
});

app.post('/upload', upload.single('csvFile'), async (req, res) => {
    try {
        const userName = req.body.userName;
        logUsage(userName);

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const entries = [];
        const filePath = req.file.path;

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                entries.push({
                    date: row.Date || '',
                    tasksAssigned: row['Tasks Assigned'] || '',
                    activitiesCarriedOut: row['Activities Carried Out'] || '',
                    technicalLearning: row['Technical Learning'] || '',
                    communication: row['Communication made in the organization'] || '',
                    outcomeReflection: row['Outcome and Reflection'] || ''
                });
            })
            .on('end', async () => {
                try {
                    // Generate PDF
                    const pdfBuffer = await generatePDF(entries);

                    // Clean up uploaded file
                    fs.unlinkSync(filePath);

                    // Send PDF
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename="daily_diary.pdf"');
                    res.send(pdfBuffer);
                } catch (error) {
                    console.error('PDF generation error:', error);
                    fs.unlinkSync(filePath);
                    res.status(500).json({ error: 'Failed to generate PDF' });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                fs.unlinkSync(filePath);
                res.status(500).json({ error: 'Failed to parse CSV file' });
            });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Daily Diary PDF Generator running on http://localhost:${PORT}`);
    console.log('Upload CSV files to generate PDFs');
});
