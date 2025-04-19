const Semester = require('../models/Semester')
const Score = require('../models/Score')
const Course = require('../models/Course')

class SemesterController {
    async addScoreToSemester(req, res) {
    try {
        const { semesterId } = req.params;
        const { HocPhan, diemSo, diemChu } = req.body;

        // Tạo Score mới
        const newScore = new Score({ HocPhan, diemSo, diemChu });
        const savedScore = await newScore.save();

        // Gắn score vào semester
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(404).send('Semester not found');

        semester.score.push(savedScore._id);
        await semester.save();

        res.redirect('/semester/' + semesterId); // hoặc res.json({ success: true })
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
    }
}

module.exports = new SemesterController();
