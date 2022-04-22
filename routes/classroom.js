const express = require('express');
var router = express.Router();
const mysql = require('mysql');
const multer = require('multer');
const date = require('date-and-time');

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

router.get('/:cid', async (req, res) => {
    const cid = req.params.cid;

    if (!req.session.user) {

        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'teacher') {


            db.query("SELECT classroom.cid, classroom.title, classroom.description, classroom.coverImg, DATE_FORMAT(classroom.created_at,'%d/%m/%y') AS created_at  FROM `classroom` INNER JOIN `classroomdetail` ON classroomdetail.cid = classroom.cid WHERE classroomdetail.cid = ? AND classroom.active = 1 AND classroomdetail.active = '1'", [cid], (err, dataClass) => {
                if (err) return console.log(err);
                else db.query("SELECT lid, title, detail,lessonFile, cid, DATE_FORMAT(created_at,'%d/%m/%y') AS created_at   FROM `lesson` WHERE cid = ? AND active = '1'", [cid], (err, dataLesson) => {
                    if (err) {
                        return console.log(err)
                    } else {
                        db.query("SELECT users.uid, users.std_id, users.fname, users.lname, users.email FROM `users` INNER JOIN `classroomdetail` ON classroomdetail.uid = users.uid WHERE classroomdetail.cid = ? AND classroomdetail.role = 'student' AND users.active = '1' AND classroomdetail.active = '1' ", [cid], (err, students) => {
                            if (err) throw err;
                            else {
                                db.query("SELECT wid, title, workFile,DATE_FORMAT(dueDate,'%d/%m/%y') AS dueDate FROM `work` WHERE cid = ? AND active = 1 ", [cid], (err, dataWork) => {
                                    if (err) {
                                        return console.log(err)
                                    } else {
                                        return res.render('teacher/classroom', { user: req.session.user, dataClass: dataClass[0], dataLesson: dataLesson, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage'), students: students, dataWork: dataWork });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        } else {
            //student type classroom detail
            db.query("SELECT cid, title, description, coverImg, DATE_FORMAT(created_at,'%d/%m/%y') AS created_at  FROM `classroom` WHERE cid = ? AND active = '1' ", [cid], (err, dataClass) => {
                if (err) return console.log(err);
                else {
                    db.query("SELECT lesson.lid, lesson.title, lesson.detail, lesson.lessonFile, lesson.cid, DATE_FORMAT(lesson.created_at,'%d/%m/%y') AS created_at FROM `lesson` INNER JOIN `classroom` ON lesson.cid = classroom.cid WHERE lesson.cid = ? AND lesson.active = '1' AND classroom.active = '1' ORDER BY lesson.lid DESC ", [cid], (err, dataLesson) => {
                        if (err) throw err;
                        else {
                            return res.render('classroom', { user: req.session.user, dataClass: dataClass[0], dataLesson: dataLesson });
                        }
                    });
                }
            });
        }

    }
});

//inspect page
router.get('/:cid/inspect/:wid', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'teacher') {

            const wid = req.params.wid;
            const className = req.query.className;
            const cid = req.params.cid;

            db.query("SELECT work.title AS titleWork ,workdetail.id, users.std_id,work.wid, users.fname, users.lname, workdetail.answerFile, DATE_FORMAT(workdetail.submitTime,'%d/%m/%y') AS submitTime , workdetail.score, work.fullScore FROM `users` INNER JOIN `workdetail` ON users.uid =  workdetail.uid INNER JOIN `work` ON workdetail.wid = work.wid WHERE work.wid = ? AND work.active = 1 AND users.active = 1", [wid], (err, docs) => {
                if (err) throw err;
                else {
                    return res.render('teacher/check-work', { user: req.session.user, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage'), docs: docs,className:className,cid:cid });
                }
            })
        } else {
            return res.redirect('/');
        }
    }
});

//save score
router.post('/save-score/:id',(req,res)=>{
    const id = req.params.id;
    const score = req.body.score;

    db.query("UPDATE `workdetail` SET score = ? WHERE id = ?",[score,id],(err,result) => {
        if(err){
            console.log(err)
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        }else{
            console.log(err)
            req.flash('successMessage', 'บันทึกคะแนนสำเร็จ');
            return res.redirect('back');
        }
    });
});

//edit classroom detail
router.post('/save-edit-classroom/:cid', upload.single('inpFile'), async (req, res) => {

    const cid = req.params.cid;
    const params = req.body;
    const title = params.title;
    const desc = params.detail;

    if (pic_name != "") {
        db.query("UPDATE `classroom` SET title = ? , description = ?, coverImg = ? WHERE cid = ?", [title, desc, pic_name, cid], (err, result) => {
            if (err) {
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                console.log(err);
                return res.redirect('/classroom/' + cid);
            }
            else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('/classroom/' + cid);
            }
        });
    } else {
        db.query("UPDATE `classroom` SET title = ? , description = ? WHERE cid = ?", [title, desc, cid], (err, result) => {
            if (err) {
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                console.log(err);
                return res.redirect('/classroom/' + cid);
            } else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('/classroom/' + cid);
            }
        });
    }

})

let lessonFileName = "";

const storageLesson = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/lessons")
    },
    filename: (req, file, cb) => {
        if (file.originalname != "") {
            lessonFileName = file.originalname;
            cb(null, lessonFileName)
        } else {
            console.log('File name is null!');
        }
    }
});

const uploadLesson = multer({ storage: storageLesson })

//add lesson
router.post('/save-lesson/:cid', uploadLesson.single('lessonFile'), (req, res) => {
    const cid = req.params.cid;
    const params = req.body;
    const title = params.title;
    const detail = params.detail;

    db.query("INSERT INTO `lesson` (title,detail,lessonFile,cid) VALUES (?,?,?,?) ", [title, detail, lessonFileName, cid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('/classroom/' + cid);
        } else {
            req.flash('successMessage', 'เพิ่มบทเรียนสำเร็จ');
            return res.redirect('/classroom/' + cid);
        }
    });
});

let workFileName = "";

const storageWork = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/works")
    },
    filename: (req, file, cb) => {
        if (file.originalname != "") {
            workFileName = file.originalname;
            cb(null, workFileName)
        } else {
            console.log('File name is null!');
        }
    }
});

const uploadWork = multer({ storage: storageWork })


//addwork
router.post('/save-work/:cid', uploadWork.single('workFile'), (req, res) => {
    const cid = req.params.cid;
    const params = req.body;
    const title = params.title;
    const detail = params.detail;
    const dueDate = params.dueDate;
    const fullScore = params.fullScore;

    db.query("INSERT INTO `work` (title,detail,workFile,fullScore,dueDate,cid) VALUES (?,?,?,?,?,?) ", [title, detail, workFileName, fullScore, dueDate, cid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('/classroom/' + cid);
        } else {
            db.query("SELECT users.uid FROM `classroomdetail` INNER JOIN `users` ON users.uid = classroomdetail.uid WHERE classroomdetail.cid = ? AND classroomdetail.role = 'student' AND users.active = '1' AND classroomdetail.active = '1' ", [cid], (err, student) => {
                if (err) {
                    console.log(err);
                    req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                    return res.redirect('/classroom/' + cid);
                } else {
                    for (let i = 0; i < student.length; i++) {
                        db.query("INSERT INTO `workdetail` (wid,uid) VALUES (?,?)", [result.insertId, student[i].uid], (err, result1) => {
                            if (err) {
                                console.log(err);
                                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                                return res.redirect('/classroom/' + cid);
                            }
                        });
                    }
                    req.flash('successMessage', 'เพิ่มงานสำเร็จ');
                    return res.redirect('/classroom/' + cid);
                }
            });
        }
    });
});

//add student in class
router.post("/save-student/:cid", (req, res) => {
    const cid = req.params.cid;
    const std_id = req.body.std_id;
    db.query("SELECT uid from `users` WHERE std_id = ? AND userType = 'student' AND active = '0' ",[std_id],(err,uid)=>{
        if(err) throw err;
        else{
            if(uid.length > 0){
                db.query("UPDATE `classdetail` SET active = 1 WHERE uid = ? ",[uid[0].uid],(err,result)=>{
                    if (err) {
                        console.log(err);
                        req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                        return res.redirect('back');
                    } else {
                        req.flash('successMessage', 'เพิ่มนักศึกษาสำเร็จ');
                        return res.redirect('back');
                    }
                });
            }else{
                db.query("SELECT uid from `users` WHERE std_id = ? AND userType = 'student' AND active = '1' ", [std_id], (err, uid) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (uid.length > 0) {
                            db.query("SELECT * FROM `classroomdetail` WHERE uid = ? AND cid = ? AND role = 'student' AND active = '1' ", [uid[0].uid, cid], (err, user) => {
                                if (err) {
                                    console.log(err);
                                    req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                                    return res.redirect('/classroom/' + cid);
                                } else {
                                    if (user.length > 0) {
                                        req.flash('errorMessage', 'นักศึกษาดังกล่าวอยู่ในห้องเรียนแล้ว');
                                        return res.redirect('/classroom/' + cid);
                                    } else {
                                        db.query("INSERT INTO `classroomdetail` (uid,cid) VALUES (?,?)", [uid[0].uid, cid], (err, result) => {
                                            if (err) {
                                                console.log(err);
                                                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                                                return res.redirect('/classroom/' + cid);
                                            } else {
                                                req.flash('successMessage', 'เพิ่มนักศึกษาสำเร็จ');
                                                return res.redirect('/classroom/' + cid);
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            req.flash('errorMessage', 'ไม่พบนักศึกษาดังกล่าว');
                            return res.redirect('/classroom/' + cid);
                        }
                    }
                });
            }
        }
    })
});

//edit lesson page
router.get("/lesson/:lid", (req, res) => {

    if (!req.session.user) {
        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'teacher') {
            const lid = req.params.lid;
            db.query("SELECT lesson.lid, lesson.title AS title1 ,classroom.title , lesson.detail, lesson.lessonFile, lesson.cid FROM `lesson` INNER JOIN `classroom` ON lesson.cid = classroom.cid WHERE lesson.lid = ? AND lesson.active = 1 ", [lid], (err, dataLesson) => {
                if (err) {
                    return console.log(err);
                } else {
                    return res.render('teacher/lesson', { user: req.session.user, dataLesson: dataLesson[0], successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage') });
                }
            });
        } else {
            //student page
            return res.redirect('/');
        }
    }
});

//save edit lesson
router.post("/save-edit-lesson/:lid", uploadLesson.single('lessonFile'), (req, res) => {
    const lid = req.params.lid;
    const params = req.body;
    const title = params.title;
    const detail = params.detail;

    if (lessonFileName == "") {
        db.query("UPDATE `lesson` SET title = ? ,detail = ? WHERE lid = ?", [title, detail, lid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                return res.redirect('/classroom/lesson/' + lid);
            } else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('/classroom/lesson/' + lid);
            }
        });
    } else {
        db.query("UPDATE `lesson` SET title = ? ,detail = ?,lessonFile = ? WHERE lid = ?", [title, detail, lessonFileName, lid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                return res.redirect('/classroom/lesson/' + lid);
            } else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('/classroom/lesson/' + lid);
            }
        });
    }
})

//delete lesson 
router.post("/delete-lesson/:lid", (req, res) => {
    const lid = req.params.lid;
    db.query("UPDATE `lesson` SET active = 0 WHERE lid = ?", [lid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        } else {
            req.flash('successMessage', 'ลบบทเรียนสำเร็จ');
            return res.redirect('back');
        }
    });
});


//work page
router.get("/work/:wid", (req, res) => {
    const wid = req.params.wid;

    if (!req.session.user) {

        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'teacher') {
            db.query("SELECT work.wid, work.title AS title1, work.detail, work.workFile, work.fullScore, DATE_FORMAT(work.dueDate,'%Y-%m-%d') AS dueDate, classroom.title, work.cid FROM `work` INNER JOIN `classroom` ON work.cid = classroom.cid WHERE classroom.active = 1 AND work.active = 1 AND work.wid = ?", [wid], (err, dataWork) => {
                if (err) throw err;
                else {
                    return res.render('teacher/work', { user: req.session.user, dataWork: dataWork[0], successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage') });
                }
            });
        } else {
            //student page
            return res.redirect('/');
        }
    }
});


//save edit work
router.post("/save-edit-work/:wid", uploadWork.single('workFile'), (req, res) => {
    const wid = req.params.wid;
    const params = req.body;
    const title = params.title;
    const detail = params.detail;
    const fullScore = params.fullScore;
    const dueDate = params.dueDate;

    if (workFileName == "") {
        db.query("UPDATE `work` SET title = ?, detail = ?, fullScore = ?, dueDate = ? WHERE wid = ? ", [title, detail, fullScore, dueDate, wid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                return res.redirect('back');
            } else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('back');
            }
        });
    } else {
        db.query("UPDATE `work` SET title = ?, detail = ?, fullScore = ?, dueDate = ?, workFile = ? WHERE wid = ?", [title, detail, fullScore, dueDate, workFileName, wid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด');
                return res.redirect('back');
            } else {
                req.flash('successMessage', 'บันทึกสำเร็จ');
                return res.redirect('back');
            }
        });
    }
});

//delete work 
router.post("/delete-work/:wid", (req, res) => {
    const wid = req.params.wid;
    db.query("UPDATE `work` SET active = 0 WHERE wid = ?", [wid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        } else {
            req.flash('successMessage', 'ลบงานสำเร็จ');
            return res.redirect('back');
        }
    });
});

//delete student
router.post("/delete-student/:uid", (req, res) => {
    const uid = req.params.uid;
    db.query("UPDATE `classroomdetail` SET active = 0 WHERE uid = ?", [uid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        } else {
            req.flash('successMessage', 'ลบนักศึกษาสำเร็จ');
            return res.redirect('back');
        }
    });
});

router.get("/:cid/:works", (req, res) => {
    const cid = req.params.cid;

    if (!req.session.user) {
        return res.redirect('/');
    } else {
        if (req.session.user.userType == 'student') {
            db.query("SELECT cid, title, description, coverImg, DATE_FORMAT(created_at,'%d/%m/%y') AS created_at  FROM `classroom` WHERE cid = ? AND active = '1' ", [cid], (err, dataClass) => {
                if (err) throw err;
                else {
                    db.query("SELECT workdetail.id,workdetail.score,workdetail.answerFile, work.wid,workdetail.isSubmit, work.title, work.detail, work.workFile, DATE_FORMAT(workdetail.submitTime,'%d/%m/%y') AS submitTime, work.fullScore, DATE_FORMAT(work.dueDate,'%d/%m/%y') AS dueDate FROM `workdetail` INNER JOIN `work` ON work.wid = workdetail.wid INNER JOIN `classroom` ON classroom.cid = work.cid WHERE classroom.cid = ? AND workdetail.uid = ? AND work.active = '1' ORDER BY work.wid DESC", [cid, req.session.user.uid], (err, dataWork) => {
                        if (err) throw err;
                        else {
                            return res.render('work', { user: req.session.user, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage'), dataClass: dataClass[0], dataWork: dataWork })
                        }
                    });
                }
            })
        } else {
            return res.redirect('/');
        }
    }
});

let answerFileName = "";

const storageAnswer = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/answers")
    },
    filename: (req, file, cb) => {
        if (file.originalname != "") {
            answerFileName = file.originalname;
            cb(null, answerFileName)
        } else {
            console.log('File name is null!');
        }
    }
});

const uploadAnswer = multer({ storage: storageAnswer })


//save answer file
router.post("/save-work-answer/:id", uploadAnswer.single('answerFile'), (req, res) => {
    const id = req.params.id;
    let now = new Date();
    let submitTime = date.format(now, 'YYYY-MM-DD');
    submitTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    db.query("UPDATE `workdetail` SET answerFile = ?, isSubmit = '1',submitTime = ? WHERE id = ?", [answerFileName, submitTime, id], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        } else {
            req.flash('successMessage', 'ส่งงานสำเร็จ');
            return res.redirect('back');
        }
    });
});


//delete classroom
router.post('/delete-classroom/:cid', (req, res) => {
    const cid = req.params.cid;
    db.query("UPDATE `classroom` SET active = 0 WHERE cid = ?", [cid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด');
            return res.redirect('back');
        } else {
            req.flash('successMesssage', 'ลบห้องเรียนสำเร็จ');
            return res.redirect('/home');
        }
    });
});


module.exports = router;
