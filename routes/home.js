const express = require('express');
var router = express.Router();
const mysql = require('mysql');
const multer = require('multer');

let pic_name = "";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/classroom")
    },
    filename: (req, file, cb) => {
        if (file.originalname != "") {
            pic_name = file.originalname;
            cb(null, pic_name)
        } else {
            console.log('File name is null!');
        }
    }
});

const upload = multer({ storage: storage })

const db = mysql.createConnection({

    user: "root",
    host: "localhost",
    password: "",
    database: "elearning_db",

})

router.get('/', (req, res) => {

    if (!req.session.user) {
        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'admin') {
            return res.redirect('/admin');;
        } else if (req.session.user.userType == 'teacher') {
            //home teacher
            db.query("SELECT classroom.cid, classroom.title, classroom.description, classroom.coverImg, DATE_FORMAT(classroom.created_at,'%d/%m/%y') AS created_at  FROM `classroom` INNER JOIN `classroomdetail` ON classroomdetail.cid = classroom.cid WHERE classroomdetail.uid = ? AND classroomdetail.role = 'teacher' AND classroom.active = '1' AND classroomdetail.active = '1' ", [req.session.user.uid], (err, allMyRoom) => {
                if (err) throw err;
                else return res.render('teacher/home', { user: req.session.user, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage'), allMyRoom: allMyRoom })
            })
        } else {
            //student page
            db.query("SELECT classroom.cid, classroom.title, classroom.description, classroom.coverImg, DATE_FORMAT(classroom.created_at,'%d/%m/%y') AS created_at  FROM `classroom` INNER JOIN `classroomdetail` ON classroomdetail.cid = classroom.cid WHERE classroomdetail.uid = ? AND classroomdetail.role = 'student' AND classroom.active = '1' AND classroomdetail.active = '1' ", [req.session.user.uid], (err, classes) => {
                return res.render('home', {classes:classes, user: req.session.user, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage') });
            });
        }
    }
});

//add class room
router.post('/save-class-room', upload.single('inpFile'), (req, res) => {
    const params = req.body;
    const user = req.session.user;
    const title = params.title;
    const desc = params.detail;

    db.query("INSERT INTO `classroom` (title,description,coverImg) VALUES (?,?,?) ", [title, desc, pic_name], (err, result) => {
        if (err) {
            console.log(err)
            req.flash('errorMessage', 'เกิดข้อผิดพลาด')
            return res.redirect('/home');
        } else {
            db.query("INSERT INTO `classroomdetail` (uid,cid,role) VALUES (?,?,?)", [req.session.user.uid, result.insertId, 'teacher'], (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log(result)
                    req.flash('successMessage', 'เพิ่มห้องเรียนสำเร็จ')
                    return res.redirect('/home');
                }
            });
        }
    });


});

module.exports = router;