var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var db = new sqlite3.Database('./db/sqlite.db', (err) => {
    if (err) {
        console.error('資料庫連接失敗:', err.message);
    } else {
        console.log('資料庫連接成功');
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.use('/', indexRouter);
app.use('/users', usersRouter);
module.exports = app;

const cors = require('cors');
app.use(cors());

app.post('/api/get_report', (req, res) => {
    const { reportType, year, month } = req.body;
    const validMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const validReportTypes = ["animal_reports", "cats", "dogs"];

    if (!validMonths.includes(month)) {
        res.status(400).send('Invalid month');
        return;
    }

    if (!validReportTypes.includes(reportType)) {
        res.status(400).send('Invalid report type');
        return;
    }

    const sql = `SELECT ${month} FROM ${reportType} WHERE year = ?`;
    db.get(sql, [year], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (!row) {
            res.status(404).send('Data not found for the specified year');
            return;
        }
        res.json({ year, month, count: row[month] });
    });
});

app.get('/api/reports', (req, res) => {
    const reportType = req.query.reportType || 'animal_reports';
    const validReportTypes = ["animal_reports", "cats", "dogs"];

    if (!validReportTypes.includes(reportType)) {
        res.status(400).send('Invalid report type');
        return;
    }

    const sql = `SELECT year, total FROM ${reportType}`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.json(rows);
    });
});
