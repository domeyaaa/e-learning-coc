const express = require('express');
var router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const e = require('express');
const saltRounds = 10;

const db = mysql.createConnection({

    user: "root",
    host: "localhost",
    password: "",
    database: "elearning_db",

})

router.get('/', (req, res) => {

    if(req.session.user){
        res.redirect('/home');
     }

    return res.render('index');
});


//register
router.post('/register',(req,res) => {
    const std_id = req.body.std_id;
    const email = req.body.email;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const userType = req.body.userType;
    bcrypt.hash(req.body.password,saltRounds,(err,hash) => {
        db.query("INSERT INTO `users` (std_id,email,fname,lname,password,userType) VALUES (?,?,?,?,?,?)",[std_id,email,fname,lname,hash,userType],(err,result) => {
            if(err){
                console.log('error');
                return res.render('index',{status:'error',message:err});
            }else{
                return res.send({status:"ok"});
            }
        });
    });
});

//login
router.post('/login',(req,res) => {

    if(req.session.user){
        return res.redirect('/home');
    }

    const email = req.body.email;
    db.query("SELECT * FROM `users` WHERE email = ? AND active = '1' ",[email],(err,users) => {
        if(err){
            return res.render('index',{status:'error',message:err});
        }if(users.length == 0){
            return res.render('index',{ststus:'error',message:'ไม่พบอีเมลผู้ใช้'});
        }
        if(users[0].active == 0){
            return res.render('index',{status:'error',message:'บัญชีของคุณถูกลบ'});
        }else{
            bcrypt.compare(req.body.password,users[0].password,(err,isLogin) => {
                if(isLogin){
                    req.session.user = users[0];
                    if(req.session.user.userType === "student" || req.session.user.userType === "teacher"){
                        return  res.redirect('/home');
                    }else{
                        return res.redirect('/admin');
                    }
                }else{
                    return res.render('index',{status:'error',message:'รหัสผ่านไม่ถูกต้อง'});
                }
            });       
        }   
    });
});

//sign out
router.post('/logout', function(req, res) {
    req.session.destroy();
   res.redirect('/');
});


module.exports = router;