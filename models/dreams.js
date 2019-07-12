const mongoose = require('mongoose');

const dreamSchema = mongoose.Schema({
    title: String,
    body: String,
    date: Date,
    public: Boolean,
    keywords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Keyword'
    }]
});

dreamSchema.index({ title: 'text', body: 'text' });

const Dream = mongoose.model('Dream', dreamSchema);

module.exports = Dream;