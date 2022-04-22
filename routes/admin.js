const e = require('express');
const express = require('express');
var router = express.Router();
const mysql = require('mysql');

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
        if (req.session.user.userType == "admin") {
            db.query("SELECT cid, title, description, DATE_FORMAT(created_at,'%d/%m/%y') AS created_at FROM `classroom` WHERE active = 1", (err, dataClass) => {
                if (err) throw err;
                else {
                    return res.render('admin/home', { dataClass: dataClass, user: req.session.user, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage') });
                }
            });

        } else {
            return res.redirect('/');
        }
    }
});


router.get('/manage-user', (req, res) => {

    if (!req.session.user) {
        return res.redirect('/');
    } else {
        if (req.session.user.userType == "admin") {
            db.query("SELECT * FROM `users` WHERE userType != 'admin' AND active != 0", (err, users) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.render('admin/manage-user', { user: req.session.user, allUser: users, successMessage: req.flash('successMessage'), errorMessage: req.flash('errorMessage') });
                }
            });
        } else {
            return res.redirect('/', { user: req.session.user });
        }
    }
});


//change User Type
router.get('/save-user-type/:uid', async (req, res) => {
    const uid = req.params.uid;
    const userType = req.query.userType;

    db.query("UPDATE `users` SET userType = ? WHERE uid = ? ", [userType, uid], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('errorMessage', 'เกิดข้อผิดพลาด')
            return res.redirect('/admin/manage-user');
        } else {
            req.flash('successMessage', 'แก้ไขประเภทผู้ใช้สำเร็จ')
            return res.redirect('/admin/manage-user');
        }
    });
});

//delete account
router.get('/delete-user/:uid', (req, res) => {
    const uid = req.params.uid;
    if (req.session.user.userType == 'admin') {
        db.query("UPDATE `users` SET active = 0 WHERE uid = ? ", [uid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด')
                return res.redirect('/admin/manage-user');
            } else {
                req.flash('successMessage', 'ลบผู้ใช้สำเร็จ')
                return res.redirect('/admin/manage-user');
            }
        });
    }else{
        return res.redirect('/');
    }
});

//delete classroom 
router.get("/delete-classroom/:cid", (req, res) => {
    const cid = req.params.cid;

    if (req.session.user.userType == 'admin') {
        db.query("UPDATE `classroom` SET active = 0 WHERE cid = ? ", [cid], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('errorMessage', 'เกิดข้อผิดพลาด')
                return res.redirect('back');
            } else {
                req.flash('successMessage', 'ลบห้องเรียนสำเร็จ')
                return res.redirect('back');
            }
        });
    } else {
        return res.redirect('/');
    }



})

module.exports = router;