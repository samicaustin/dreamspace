/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = express.Router();
const User = require('../models/users');
const Dream = require('../models/dreams');
const Keyword = require('../models/keywords');

const maxTextKeywords = 3; // max num keywords to display

// add require login middleware
const requireLogin = require('../middleware/requireLogin');

// helper function to randomize array from Stack Overflow
/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

// INDEX ROUTE
router.get('/', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const myDbUser = await User.findById(thisUsersDbId)
            .populate({ path: 'dreams', populate: { path: 'keywords' } });
        const keywords = await Keyword.find({}).sort([['count', -1]]);
        res.render('dreams/index.ejs', {
            user: myDbUser,
            dreams: myDbUser.dreams,
            currentUser: thisUsersDbId,
            keywords,
        });
    } catch (err) {
        res.send(err);
    }
});

// NEW ROUTE
router.get('/new', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const allKeywords = await Keyword.find({}).sort('word');

        const today = new Date().toISOString().substr(0, 10);

        res.render('dreams/new.ejs', {
            keywords: allKeywords,
            currentUser: thisUsersDbId,
            todaysDate: today,
        });
    } catch (err) {
        res.send(err);
    }
});

// SHOW ROUTE
router.get('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const thisDream = await Dream.findById(req.params.id);
        shuffleArray(thisDream.keywords); // randomly shuffle displayed keyword
        const myKeywords = [];
        let thisKeyword;
        for (let i = 0; i < thisDream.keywords.length; i++) {
            thisKeyword = await Keyword.findById(thisDream.keywords[i]);
            myKeywords.push(thisKeyword);
        }
        const myDbUser = await User.findOne({ dreams: req.params.id });
        if ((myDbUser._id.toString() === thisUsersDbId.toString()) || (thisDream.public === true)) {
            res.render('dreams/show.ejs', {
                dream: thisDream,
                currentUser: thisUsersDbId,
                keywords: myKeywords,
            });
        } else {
            req.session.message = 'You dont have access to this dream';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

// helper function to match up dream content with keywords
const findAllKeywordsInDream = async (reqBody) => {
    try {
        const dreamText = reqBody.body.toLocaleLowerCase();
        const dreamTitle = reqBody.title.toLocaleLowerCase();
        const dropdownKeywordId = reqBody.keywordId;
        const allKeywords = await Keyword.find({});
        const allMatchingKeywords = [];
        allKeywords.forEach((keyword) => {
            if (keyword._id.toString() !== dropdownKeywordId.toString()) {
                if (dreamText.includes(` ${keyword.word.toLocaleLowerCase()}`) || dreamTitle.includes(` ${keyword.word.toLocaleLowerCase()}`)) {
                    allMatchingKeywords.push(keyword._id);
                }
            }
        });
        console.log(allMatchingKeywords);
        return (allMatchingKeywords);
    } catch (err) {
        console.log(err);
        return (err);
    }
};

// CREATE ROUTE
router.post('/', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.body.public === 'on') {
            req.body.public = true;
        } else {
            req.body.public = false;
        }
        // create new dream
        const newDream = await Dream.create(req.body);
        // add drop-down keyword/theme user chose
        newDream.keywords.push(req.body.keywordId);
        // save the dream
        await newDream.save();
        // add a few random keywords by _id from req.body into dream.keywords array
        const keywordsInText = await findAllKeywordsInDream(req.body);
        if (keywordsInText.length > 0) {
            shuffleArray(keywordsInText); // shuffle keywords in place for random population
            for (let i = 0; i < keywordsInText.length && (i + 1) < maxTextKeywords; i++) {
                // add keywords from text (dropdown keyword) was added earlier
                newDream.keywords.push(keywordsInText[i]);
            }
            // save the dream
            await newDream.save();
        }
        if (req.body.keywordId) {
            const keywordCount = await Keyword.findById(req.body.keywordId);
            keywordCount.count++;
            keywordCount.save();
        }
        console.log(newDream, 'after keyword push!!!');

        // save the user
        const newDreamsUser = await User.findById(thisUsersDbId);
        newDreamsUser.dreams.push(newDream._id);
        await newDreamsUser.save();
        res.redirect('/dreams');
    } catch (err) {
        res.send(err);
    }
});

// EDIT ROUTE
router.get('/:id/edit', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const myDbUser = await User.findById(thisUsersDbId);
        const allKeywords = await Keyword.find({}).sort('word');
        const myDream = await Dream.findById(req.params.id);

        let foundDreamFlag = false;
        myDbUser.dreams.forEach((myDbUserDream) => {
            if (myDbUserDream._id.toString() === req.params.id.toString()) {
                foundDreamFlag = true;
            }
        });

        if (foundDreamFlag) {
            // get the photos upload date and convert for display on edit page.
            const datePickerFormat = myDream.date.toISOString().substr(0, 10);
            res.render('dreams/edit.ejs', {
                currentUser: thisUsersDbId,
                dream: myDream,
                keywords: allKeywords,
                datePickerFormat,
            });
        } else {
            req.session.message = 'You dont have access to this dream';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

// UPDATE ROUTE
router.put('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        if (req.body.public === 'on') {
            req.body.public = true;
        } else {
            req.body.public = false;
        }

        const foundUser = await User.findOne({ dreams: req.params.id });
        if (foundUser._id.toString() === thisUsersDbId.toString()) {
            const updatedDream = await Dream.findByIdAndUpdate(req.params.id, req.body, { new: true });

            // add drop-down keyword/theme user chose
            updatedDream.keywords = [];
            updatedDream.keywords.push(req.body.keywordId);
            // save the dream
            await updatedDream.save();

            // add a few random Keywords (by _id) from req.body to updatedDream.keywords array
            const keywordsInText = await findAllKeywordsInDream(req.body);

            if (keywordsInText.length > 0) {
                shuffleArray(keywordsInText); // shuffle keywords in place for random population
                for (let i = 0; i < keywordsInText.length && (i + 1) < maxTextKeywords; i++) {
                    // add keyword if it's _id is not already present from dropdown
                    // if (updatedDream.keywords.includes(keywordsInText[i]._id.toString()) === false) {
                    updatedDream.keywords.push(keywordsInText[i]);
                    // }
                }
                // save the dream
                await updatedDream.save();
            }
            res.redirect(`/dreams/${req.params.id}`);
        } else {
            req.session.message = 'You dont have access to this dream';
        }
    } catch (err) {
        res.send(err);
    }
});

// DELETE ROUTE
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const deletedDream = await Dream.findByIdAndDelete(req.params.id);
        console.log(deletedDream);
        const foundUser = await User.findOne({ dreams: req.params.id });
        if (thisUsersDbId.toString() === foundUser._id.toString()) {
            foundUser.dreams.remove(req.params.id);
            await foundUser.save();
            if (req.body.keywordId) {
                const keywordCount = await Keyword.findById(req.body.keywordId);
                keywordCount.count--;
                keywordCount.save();
            }
            console.log(foundUser);
            res.redirect('/dreams');
        } else {
            req.session.message = 'You dont have access to this dream';
            console.log(req.session.message);
            res.send(req.session.message);
        }
    } catch (err) {
        res.send(err);
    }
});

module.exports = router;
