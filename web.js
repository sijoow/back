const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const cron = require('node-cron');
const app = express();
const PORT = 8007;
app.use(cors());
app.use(express.json());

let db;

MongoClient.connect('mongodb+srv://yogibo:yogibo@cluster0.vvkyawf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', function(err, client) {
    if (err) return console.log(err);
    db = client.db('todoapp');
    console.log('MongoDB에 연결되었습니다.');
    // 매일 자정에 실행될 작업을 스케줄링합니다.
    cron.schedule('0 0 * * *', function() {
        const currentDate = new Date().toISOString().slice(0, 10);
        const collection = db.collection('attend');

        // 모든 사용자의 출석체크 상태를 조회하고 초기화합니다.
        collection.find().forEach((doc) => {
            if (doc.date !== currentDate) {
                collection.updateOne({ memberId: doc.memberId }, { $set: { attendanceCounter: 0 } });
            }
        });
    });
});

app.post('/attend', (req, res) => {
    const { memberId } = req.body;
    const currentDate = new Date().toISOString().slice(0, 10);
    const collection = db.collection('attend');

    // 해당 memberId의 최근 출석체크 데이터를 조회합니다.
    collection.findOne({ memberId }, (err, existingAttendance) => {
        if (err) {
            console.error('Error finding attendance:', err);
            return res.status(500).json({ error: 'Server error occurred while checking attendance.' });
        }

        if (existingAttendance && existingAttendance.date === currentDate) {
            console.log('User has already attended.');
            return res.status(400).json({ message: 'User has already attended.', alreadyAttended: true });
        } else {
            const newAttendanceCount = existingAttendance ? existingAttendance.attendanceCounter + 1 : 1;

            // 출석체크 데이터를 업데이트합니다. 기존 데이터가 없으면 새로운 데이터를 생성합니다.
            collection.updateOne({ memberId }, { $set: { date: currentDate, attendanceCounter: newAttendanceCount } }, { upsert: true }, (err, result) => {
                if (err) {
                    console.error('Error saving attendance record:', err);
                    return res.status(500).json({ error: 'Failed to save attendance.' });
                } else {
                    console.log('Attendance record saved.');
                    res.json({ message: 'Attendance completed.', consecutiveAttendance: newAttendanceCount, attendanceCounter: newAttendanceCount });
                }
            });
        }
    });
});
app.post('/attend', (req, res) => {
    const { memberId } = req.body;
    const currentDate = new Date().toISOString().slice(0, 10);
    const collection = db.collection('attend');

    // 해당 memberId의 최근 출석체크 데이터를 조회합니다.
    collection.findOne({ memberId }, (err, existingAttendance) => {
        if (err) {
            console.error('Error finding attendance:', err);
            return res.status(500).json({ error: 'Server error occurred while checking attendance.' });
        }

        if (existingAttendance && existingAttendance.date === currentDate) {
            console.log('User has already attended.');
            return res.status(400).json({ message: 'User has already attended.', alreadyAttended: true });
        } else {
            let newAttendanceCount;
            if (existingAttendance) {
                // 연속 출석체크가 실패하였는지 확인합니다.
                const lastAttendanceDate = new Date(existingAttendance.date);
                const currentDate = new Date();
                // 마지막 출석체크 날짜와 현재 날짜 사이의 차이를 확인합니다.
                const dateDiff = Math.ceil(Math.abs(currentDate - lastAttendanceDate) / (1000 * 60 * 60 * 24));
                if (dateDiff > 1) {
                    // 출석체크를 건너뛴 날이 있으므로 출석체크 횟수를 초기화합니다.
                    newAttendanceCount = 1;
                } else {
                    // 출석체크를 건너뛴 날이 없으므로 출석체크 횟수를 증가시킵니다.
                    newAttendanceCount = existingAttendance.attendanceCounter + 1;
                }
            } else {
                // 첫 출석체크이므로 출석체크 횟수를 1로 설정합니다.
                newAttendanceCount = 1;
            }

            // 출석체크 데이터를 업데이트합니다. 기존 데이터가 없으면 새로운 데이터를 생성합니다.
            collection.updateOne({ memberId }, { $set: { date: currentDate, attendanceCounter: newAttendanceCount } }, { upsert: true }, (err, result) => {
                if (err) {
                    console.error('에러:', err);
                    return res.status(500).json({ error: 'Failed to save attendance.' });
                } else {
                    console.log('에러발생');
                    res.json({ message: 'Attendance completed.', consecutiveAttendance: newAttendanceCount, attendanceCounter: newAttendanceCount });
                }
            });
        }
    });
});