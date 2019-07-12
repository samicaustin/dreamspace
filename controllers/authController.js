/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');
const User = require('../models/users');
const Keyword = require('../models/keywords');

// require middleware
const showMessagesAndUsername = require('../middleware/showSessionMessages');

router.get('/register', showMessagesAndUsername, (req, res) => {
    const thisUsersDbId = req.session.usersDbId;
    res.render('auth/register.ejs', {
        currentUser: thisUsersDbId,
        message: req.session.message,
    });
});

router.post('/register', showMessagesAndUsername, async (req, res) => {
    try {
        const foundUser = await User.findOne({ username: req.body.username });
        if (!foundUser) {
            const password = req.body.password;
            const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
            const userDbEntry = {};
            userDbEntry.username = req.body.username;
            userDbEntry.password = passwordHash;
            const createdUser = await User.create(userDbEntry);
            req.session.logged = true;
            req.session.usersDbId = createdUser._id;
            res.redirect('/dreams');
        } else {
            req.session.message = 'This username is already taken. Please choose again.';
            console.log(req.session.message);
            const thisUsersDbId = req.session.usersDbId;
            res.render('auth/register.ejs', {
                currentUser: thisUsersDbId,
                message: req.session.message,
            });
        }
    } catch (err) {
        res.send(err);
    }
});

// helper function for login to show session messages
const renderLoginPage = async (req, res) => {
    const thisUsersDbId = req.session.usersDbId;
    const allKeywords = await Keyword.find({}).sort([['count', -1]]);
    res.render('auth/login.ejs', {
        currentUser: thisUsersDbId,
        keywords: allKeywords,
        message: req.session.message,
    });
};

router.get('/login', showMessagesAndUsername, async (req, res) => {
    try {
        renderLoginPage(req, res);
    } catch (err) {
        res.send(err);
    }
});

router.post('/login', showMessagesAndUsername, async (req, res) => {
    try {
        const foundUser = await User.findOne({ username: req.body.username });
        if (foundUser) {
            if (bcrypt.compareSync(req.body.password, foundUser.password) === true) {
                console.log(req.body.password);
                req.session.message = '';
                req.session.logged = true;
                req.session.username = req.body.username;
                req.session.usersDbId = foundUser._id;
                console.log(req.session, 'successful login');
                res.redirect('/dreams');
            } else {
                req.session.message = 'Incorrect username or password. Please try again.';
                console.log(req.session.message);
                renderLoginPage(req, res);
            }
        } else {
            req.session.message = 'Incorrect username or password. Please try again.';
            console.log(req.session.message);
            renderLoginPage(req, res);
        }
    } catch (err) {
        res.send(err);
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send(err);
        } else {
            res.redirect('/auth/login');
        }
    });
});

module.exports = router;
