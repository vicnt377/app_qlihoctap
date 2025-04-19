const Semester = require('../models/Semester');
const Score = require('../models/Score');

class ClassController {
    async getClass(req, res) {
        try {
            const year = req.query.year || '2021 - 2022';
            const semester = req.query.semester || 'Học Kỳ 1';

            const filter = {};
            if (year && year !== 'Tất cả') filter.namHoc = year;
            if (semester && semester !== 'Tất cả') filter.tenHocKy = semester;

            // Tìm các học kỳ thỏa điều kiện (có thể là nhiều)
            const semesterDocs = await Semester.find(filter)
                .populate({
                    path: 'score',
                    populate: { path: 'HocPhan' }
                })
                .lean();

            const classesGroupedBySemester = semesterDocs.map(sem => ({
                tenHocKy: sem.tenHocKy,
                namHoc: sem.namHoc,
                scores: sem.score || []
            }));
                

            // Dropdown data
            const years = await Semester.distinct('namHoc');
            const semestersList = await Semester.distinct('tenHocKy');

            res.render('class', {
                classesGroupedBySemester,
                selectedSemester: semester,
                selectedYear: year,
                years,
                semestersList
            });
            

        } catch (error) {
            console.error('Lỗi lấy lịch học:', error.message);
            res.status(500).send('Lỗi khi lấy dữ liệu lớp học!');
        }
    }
}

module.exports = new ClassController();
