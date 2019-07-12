/* eslint-disable prefer-template */
const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();
const User = require('../models/users');
const Dream = require('../models/dreams');
const Keyword = require('../models/keywords');

// add require login middleware
const requireLogin = require('../middleware/requireLogin');

// index route
router.get('/', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const users = await User.find({});
        res.render('users/index.ejs', {
            users,
            currentUser: thisUsersDbId,
        });
    } catch (err) {
        res.send(err);
    }
});

// show route
router.get('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.params.id === thisUsersDbId) {
            const thisUsersDbId = req.session.usersDbId;
            const foundUser = await User.findById(req.params.id)
                .populate({ path: 'dreams', populate: { path: 'keywords' } });
            const keywords = await Keyword.find();
            res.render('users/show.ejs', {
                user: foundUser,
                currentUser: thisUsersDbId,
                keywords,
            });
        } else {
            req.session.message = 'You dont have access to this user';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

// edit route
router.get('/:id/edit', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.params.id === thisUsersDbId) {
            const foundUser = await User.findById(req.params.id);
            res.render('users/edit.ejs', {
                user: foundUser,
                currentUser: thisUsersDbId,
            });
        } else {
            req.session.message = 'You dont have access to this user';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

// update route
router.put('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.params.id === thisUsersDbId) {
            req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
            const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.redirect('/auth/login');
        } else {
            req.session.message = 'You dont have access to this user';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

// delete route
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.params.id === thisUsersDbId) {
            const deletedUser = await User.findByIdAndRemove(req.params.id);
            console.log(deletedUser);
            await Dream.deleteMany({
                _id: {
                    $in: deletedUser.dreams,
                },
            });
            req.session.destroy((err) => {
                if (err) {
                    res.send(err);
                } else {
                    res.redirect('/auth/register');
                }
            });
        } else {
            req.session.message = 'You dont have access to this user';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

module.exports = router;
