/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const express = require('express');
const app = express();
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
const authController = require('./controllers/authController');
const dreamController = require('./controllers/dreamController');
const userController = require('./controllers/userController');
const requireLogin = require('./middleware/requireLogin');
const Dream = require('./models/dreams');
const Keyword = require('./models/keywords');
const User = require('./models/users');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'mySessions',
});

app.use(session({
    secret: 'sdflawiefuawi3ur487gbisub3w434',
    resave: false,
    saveUninitialized: false,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('short'));
require('./db/db');

app.use(express.static('Public'));

const keywordsData = require('./populateKeywords');

// Utility function from Stack Overflow to see if an object is empty
const isEmpty = (obj) => {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) { return false; }
    }
    return true;
};

// Insert Using Mongoose called from home/index at localhost:3000/ ONLY if empty
const populateKeywordsFunc = () => {
    keywordsData.forEach((keyword) => {
        Keyword.create({
            word: keyword.word,
            meaning: keyword.meaning,
        }, (err, createdKeyword) => {
            if (err) {
                console.log(err);
            } else {
                console.log(createdKeyword);
            }
        });
    });
};

// SEARCH ROUTE
app.get('/search', requireLogin, async (req, res) => {
    try {
        const thisUsersDbId = req.session.usersDbId;
        const searchTerm = req.query.term.toString().toLocaleLowerCase();
        let matchingPublicDreams;
        let matchingPrivateDreams;
        if (searchTerm !== '') {
            matchingPublicDreams = await Dream.find({
                $and: [
                    { $text: { $search: searchTerm } },
                    { public: true }],
            }).populate('keywords').sort('title');

            matchingPrivateDreams = await Dream.find({
                $and: [
                    { $text: { $search: searchTerm } },
                    { public: false }],
            }).populate('keywords').sort('title');
        } else {
            matchingPublicDreams = await Dream.find({ public: true })
                .populate('keywords').sort('title');
            matchingPrivateDreams = await Dream.find({ public: false })
                .populate('keywords').sort('title');
        }

        const myDbUser = await User.findById(thisUsersDbId)
            .populate('dreams');

        // sort the usersDreams alphabetically by title
        const sortedUsersDreams = myDbUser.dreams.sort((a, b) => {
            if (a.title < b.title) { return -1; }
            if (a.title > b.title) { return 1; }
            return 0;
        });

        console.log(matchingPrivateDreams);

        const matchingUsersDreams = [];
        sortedUsersDreams.forEach((userDream) => {
            matchingPrivateDreams.forEach((privateDream) => {
                if (userDream._id.toString() === privateDream._id.toString()) {
                    matchingUsersDreams.push(privateDream);
                    console.log(userDream._id);
                    console.log(privateDream._id);
                    console.log(sortedUsersDreams);
                }
            });
        });

        res.render('search.ejs', {
            publicDreams: matchingPublicDreams,
            usersDreams: matchingUsersDreams,
            currentUser: thisUsersDbId,
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

// home page as login route
app.get('/', async (req, res) => {
    try {
        // Add the keyword test data if the collection is empty
        const anyKeywords = await Keyword.find({});
        if (isEmpty(anyKeywords)) {
            populateKeywordsFunc();
            console.log(anyKeywords);
        }

        const thisUsersDbId = req.session.usersDbId;
        const keywords = await Keyword.find({});
        const message = '';
        res.render('auth/login.ejs', {
            currentUser: thisUsersDbId,
            keywords,
            message,
        });
    } catch (err) {
        res.send(err);
    }
});

app.use('/users', userController);
app.use('/dreams', dreamController);
app.use('/auth', authController);

app.listen(process.env.PORT, () => {
    console.log('listening on port 3000');
});
